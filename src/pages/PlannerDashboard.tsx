import React, { useState, useEffect, useMemo } from "react";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { mapsService } from "../config/maps";
import {
  planVisits,
  calculateDistance,
  buildSchedulingDebugSummary,
} from "../utils/scheduleUtils";
// import FilePreview from "../components/FilePreview"; // Unused for now; retained for planned review/cleanup.
import GenerateControls from "../components/planner/GenerateControls";
import UploadedFilesPanel from "../components/planner/UploadedFilesPanel";
import FileUploader from "../components/FileUploader";
import ScheduleSettings from "../components/ScheduleSettings";
import ScheduleDisplay from "../components/ScheduleDisplay";
import UnscheduledPubsPanel from "../components/UnscheduledPubsPanel";
import RepStatsPanel from "../components/RepStatsPanel";
import FileTypeDialog from "../components/FileTypeDialog";
// import VehicleSelector from "../components/VehicleSelector"; // Unused for now; retained for planned review/cleanup.
import {
  usePubData,
  Pub,
  UserFiles,
  FileMetadata,
  ExtendedPub,
  ListType,
} from "../context/PubDataContext";
import { devLog } from "../utils/devLog";
import { toArray } from "../utils/typeGuards";
import { toScheduleDays } from "../utils/scheduleMappers";

interface ScheduleVisit extends ExtendedPub {
  Priority: string;
  mileageToNext: number;
  driveTimeToNext: number;
}

const PlannerDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_unscheduledPubs, setUnscheduledPubs] = useState<ExtendedPub[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileMetadata[]>([]);
  const [selectedPub, setSelectedPub] = useState<ExtendedPub | null>(null);
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [currentFileName, setCurrentFileName] = useState("");
  const [processedPubs, setProcessedPubs] = useState<ExtendedPub[]>([]);
  const [isQuickStartExpanded, setIsQuickStartExpanded] = useState(true);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [initialValues, setInitialValues] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(1);

  // Clear schedule before generating new one
  const clearSchedule = () => {
    devLog("Clearing previous schedule");
    setSchedule([]);
    setSchedulingDebug(null);
    setUnscheduledPubs([]);
    setSelectedPub(null);
    setSelectedDay(null);
    setError(null);
  };

  const {
    userFiles,
    setUserFiles,
    businessDays,
    schedule,
    setSchedule,
    homeAddress,
    visitsPerDay,
    searchRadius,
    selectedVehicle,
    selectedVehicleColor,
    setSchedulingDebug,
  } = usePubData();

  // Extract pubs by type from userFiles
  const masterfilePubs = userFiles.pubs.filter(
    (pub) => pub.listType === "masterhouse"
  );
  const repslyWins = userFiles.pubs.filter((pub) => pub.listType === "wins");
  const wishlistPubs = userFiles.pubs.filter(
    (pub) => pub.listType === "hitlist"
  );
  const unvisitedPubs = userFiles.pubs.filter(
    (pub) => pub.listType === "unvisited"
  );

  // Get deadline from wins file if it exists
  const repslyDeadline = userFiles.files?.find(
    (f) => f.type === "wins"
  )?.deadline;

  // Compute which priorities are already taken
  const getLevel = (f: any) =>
    typeof f.priority === 'number' ? f.priority : undefined;

  const usedPriorities = useMemo(() => Array.from(new Set(
    userFiles.files
      .filter(f => f.type === 'hitlist' || f.type === 'wins')
      .map(getLevel)
      .filter((n: any): n is 1|2|3 => n === 1 || n === 2 || n === 3)
  )), [userFiles.files]);

  // Log used priorities in useEffect to prevent spam
  useEffect(() => {
    devLog('[Used priorities]', usedPriorities, userFiles.files.map(f => ({
      name: f.fileName, type: f.type, priority: f.priority
    })));
  }, [usedPriorities, userFiles.files]);

  const generateOptimalSchedule = async () => {
    // Get all wins files and check if any are missing follow-up days
    const winsFiles = userFiles.files?.filter((f) => f.type === "wins") || [];
    const winsWithoutFollowUp = winsFiles.filter((f) => !f.followUpDays);

    if (winsFiles.length > 0 && winsWithoutFollowUp.length > 0) {
      setError("Please set follow-up days for Recent Wins");
      throw new Error("Missing follow-up days for Recent Wins");
    }

    if (!homeAddress) {
      setError("Please enter your home address postcode");
      throw new Error("Missing home address");
    }

    // Collapse quick start section when generating schedule
    setIsQuickStartExpanded(false);

    // Clear previous schedule
    setSchedule([]);
    setUnscheduledPubs([]);

    // Get all pubs with their respective deadlines from file metadata
    const repslyWins = userFiles.pubs.filter((pub) => pub.listType === "wins");
    // const _repslyDeadlines = new Map(
    //   (userFiles.files?.filter((f) => f.type === "wins") || []).map((f) => [
    //     f.fileId,
    //     f.deadline,
    //   ])
    // );

    const processedRepslyWins = repslyWins.map((pub) => ({
      ...pub,
      Priority: "RecentWin",
      followUpDays: pub.fileId
        ? userFiles.files?.find((f) => f.fileId === pub.fileId)?.followUpDays
        : undefined,
    }));

    const wishlistPubs = userFiles.pubs.filter(
      (pub) => pub.listType === "hitlist"
    );
    const unvisitedPubs = userFiles.pubs.filter(
      (pub) => pub.listType === "unvisited"
    );
    const masterfilePubs = userFiles.pubs.filter(
      (pub) => pub.listType === "masterhouse"
    );

    const allPubs = [
      ...processedRepslyWins,
      ...wishlistPubs.map((pub) => ({ ...pub, Priority: "Wishlist" })),
      ...unvisitedPubs.map((pub) => ({ ...pub, Priority: "Unvisited" })),
      ...masterfilePubs.map((pub) => ({ ...pub, Priority: "Masterfile" })),
    ];

    if (allPubs.length === 0) {
      setError("No pubs available to schedule");
      throw new Error("No pubs available");
    }

    devLog("Generating new schedule with:", {
      pubs: allPubs.length,
      days: businessDays,
      home: homeAddress,
      visitsPerDay,
      searchRadius,
    });

    const newSchedule = await planVisits(
      allPubs,
      new Date(),
      businessDays,
      homeAddress,
      visitsPerDay,
      searchRadius
    );

    devLog("Generated schedule:", newSchedule);
    setSchedule(toScheduleDays(newSchedule));
    setSchedulingDebug(
      buildSchedulingDebugSummary(
        allPubs,
        newSchedule,
        visitsPerDay,
        homeAddress,
        businessDays
      )
    );
    return newSchedule;
  };

  const generateSchedule = async () => {
    setIsGenerating(true);
    setError(null);
    clearSchedule(); // Add explicit clearSchedule call here

    try {
      await generateOptimalSchedule();
      setActiveStep(5); // Update to step 5 since we added vehicle selection
    } catch (error) {
      devLog("Error generating schedule:", error);
      setError("Failed to generate schedule. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleScheduleAnyway = (pub: ExtendedPub) => {
    devLog("Adding pub to schedule:", pub);

    // Validate pub data
    if (
      schedule.some((day) => toArray(day.visits).some((visit) => visit.pub === pub.pub))
    ) {
      devLog("Pub already scheduled:", pub.pub);
      return;
    }

    if (!pub || !pub.zip) {
      devLog("Invalid pub data:", pub);
      return;
    }

    // Find the selected day or first day with available space
    const dayIndex = selectedDay
      ? schedule.findIndex((day) => day.date === selectedDay)
      : schedule.findIndex((day) => toArray(day.visits).length < visitsPerDay);

    if (dayIndex === -1) {
      devLog("No days with available space");
      setError("No available space in schedule");
      return;
    }

    const dayWithSpace = schedule[dayIndex];

    // Check if day is already at capacity
    if (toArray(dayWithSpace.visits).length >= visitsPerDay) {
      devLog("Day is at capacity:", dayWithSpace.date);
      setError(
        `Cannot add more visits to ${dayWithSpace.date} - day is at capacity`
      );
      return;
    }

    const visits = [...toArray(dayWithSpace.visits)];
    const lastVisit = visits[visits.length - 1];
    let totalMileage = dayWithSpace.totalMileage || 0;
    let totalDriveTime = dayWithSpace.totalDriveTime || 0;

    if (visits.length === 0) {
      const { mileage, driveTime } = calculateDistance(homeAddress, pub.zip);
      totalMileage = mileage;
      totalDriveTime = driveTime;
    } else {
      const { mileage, driveTime } = calculateDistance(lastVisit.zip, pub.zip);
      lastVisit.mileageToNext = mileage;
      lastVisit.driveTimeToNext = driveTime;
      totalMileage += mileage;
      totalDriveTime += driveTime;
    }

    const { mileage: mileageToHome, driveTime: driveTimeToHome } =
      calculateDistance(pub.zip, homeAddress);

    const newVisit: ScheduleVisit = {
      ...pub,
      Priority: pub.Priority || "Unvisited",
      mileageToNext: 0,
      driveTimeToNext: 0,
    };

    visits.push(newVisit);
    totalMileage += mileageToHome;
    totalDriveTime += driveTimeToHome;

    const updatedSchedule = schedule.map((day, index) => {
      if (index !== dayIndex) return day;
      return {
        ...dayWithSpace,
        visits,
        totalMileage,
        totalDriveTime,
        endMileage: mileageToHome,
        endDriveTime: driveTimeToHome,
      };
    });

    setSelectedDay(dayWithSpace.date ?? null);
    setSchedule(updatedSchedule);

    // Return true to indicate success
    return true;
  };

  useEffect(() => {
    const initializeMaps = async () => {
      try {
        await mapsService.initialize();
        setIsLoading(false);
      } catch (err) {
        devLog("Maps initialization error:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to initialize maps service";
        devLog("Detailed error:", errorMessage);
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    initializeMaps();
  }, []);

  // Update uploaded files when pub lists change
  useEffect(() => {
    if (!userFiles?.pubs?.length) return;

    devLog("Updating uploaded files with:", {
      masterfile: masterfilePubs.map((p) => ({
        id: p.fileId,
        name: p.fileName,
      })),
      wins: repslyWins.map((p) => ({ id: p.fileId, name: p.fileName })),
      wishlist: wishlistPubs.map((p) => ({ id: p.fileId, name: p.fileName })),
      unvisited: unvisitedPubs.map((p) => ({ id: p.fileId, name: p.fileName })),
    });

    const files = [];

    // Group pubs by fileId to handle multiple files of the same type
    const groupPubsByFile = (
      pubs: ExtendedPub[],
      type: ListType
    ): FileMetadata[] => {
      if (!pubs.length) return [];

      // Create a map to group pubs by fileId
      const groups = new Map<string, ExtendedPub[]>();

      // Group pubs by their fileId
      pubs.forEach((pub) => {
        if (!pub.fileId || !pub.fileName) return;
        const group = groups.get(pub.fileId) || [];
        groups.set(pub.fileId, [...group, pub]);
      });

      devLog(`Grouped ${type} pubs:`, {
        totalPubs: pubs.length,
        groups: groups.size,
      });

      // Convert groups to array of file objects
      return Array.from(groups.entries()).map(([fileId, groupPubs]) => ({
        fileId,
        fileName: groupPubs[0].fileName,
        type,
        count: groupPubs.length,
        priority: groupPubs[0].deadline
          ? undefined
          : getPriorityLevel(type, groupPubs[0]),
        deadline:
          groupPubs[0].deadline ||
          (type === "wins" ? repslyDeadline : undefined),
        color: getFileColor(type),
        uploadTime: groupPubs[0].uploadTime,
        name: groupPubs[0].fileName || fileId,
        followUpDays: type === "wins" ? groupPubs[0].followUpDays : undefined,
      }));
    };

    const getPriorityLevel = (type: string, pub: Pub): number => {
      switch (type) {
        case "wins":
          return 1;
        case "hitlist":
          return pub.priorityLevel || 2;
        case "unvisited":
          return 3;
        default:
          return 4;
      }
    };

    const getFileColor = (type: ListType): string => {
      switch (type) {
        case "masterhouse":
          return "bg-gray-900/20 border-gray-700/50";
        case "wins":
          return "bg-purple-900/20 border-purple-700/50";
        case "hitlist":
          return "bg-blue-900/20 border-blue-700/50";
        case "unvisited":
          return "bg-green-900/20 border-green-700/50";
        default:
          return "bg-gray-900/20 border-gray-700/50";
      }
    };

    // Process each list type
    if (masterfilePubs.length > 0) {
      files.push(
        ...groupPubsByFile(masterfilePubs, "masterhouse").map((file) => ({
          ...file,
          name: file.fileName || "Territory List",
        }))
      );
    }

    if (repslyWins.length > 0) {
      files.push(
        ...groupPubsByFile(repslyWins, "wins").map((file) => ({
          ...file,
          name: file.fileName || "Recent Wins",
        }))
      );
    }

    if (wishlistPubs.length > 0) {
      files.push(
        ...groupPubsByFile(wishlistPubs, "hitlist").map((file) => ({
          ...file,
          name: file.fileName || "Hit List",
        }))
      );
    }

    if (unvisitedPubs.length > 0) {
      files.push(
        ...groupPubsByFile(unvisitedPubs, "unvisited").map((file) => ({
          ...file,
          name: file.fileName || "Growth Opportunities",
        }))
      );
    }

    // Sort by upload time (newest first) and priority
    const sortedFiles = files.sort((a, b) => {
      if (a.uploadTime !== b.uploadTime) {
        return (b.uploadTime || 0) - (a.uploadTime || 0);
      }
      return (a.priority || 4) - (b.priority || 4);
    });

    devLog("Setting uploaded files:", sortedFiles);
    setUploadedFiles(sortedFiles);

    // Update the files array in userFiles
    setUserFiles((prev: UserFiles) => ({
      ...prev,
      files: sortedFiles,
    }));
  }, [userFiles.pubs]);

  // Debug logging for file operations
  useEffect(() => {
    if (!uploadedFiles.length) return;

    devLog("Current uploaded files:", {
      files: uploadedFiles.map((f) => ({
        name: f.name,
        type: f.type,
        count: f.count,
        fileId: f.fileId,
      })),
    });
  }, [uploadedFiles]);

  const handleFileEdit = (fileId: string) => {
    const file = uploadedFiles.find((f) => f.fileId === fileId);
    if (!file) {
      console.warn("File not found for editing:", fileId);
      return;
    }

    // Find the pubs associated with this file
    let pubsToEdit: Pub[] = [];
    switch (file.type) {
      case "masterhouse":
        pubsToEdit = masterfilePubs.filter((p) => p.fileId === fileId);
        break;
      case "wins":
        pubsToEdit = repslyWins.filter((p) => p.fileId === fileId);
        break;
      case "hitlist":
        pubsToEdit = wishlistPubs.filter((p) => p.fileId === fileId);
        break;
      case "unvisited":
        pubsToEdit = unvisitedPubs.filter((p) => p.fileId === fileId);
        break;
    }

    if (pubsToEdit.length === 0) {
      console.warn("No pubs found for file:", fileId);
      return;
    }

    // Get the first pub to extract common settings
    const firstPub = pubsToEdit[0];

    // Show the FileTypeDialog with current settings
    setShowTypeDialog(true);
    setCurrentFileName(firstPub.fileName || "");
    setProcessedPubs(pubsToEdit);
    setSelectedFileId(fileId);
    setInitialValues({
      type: file.type,
      deadline: firstPub.deadline,
      priorityLevel: firstPub.priorityLevel,
      followUpDays: firstPub.followUpDays,
    });
  };

  const handleTypeDialogSubmit = (
    type: ListType,
    deadline?: string,
    priorityLevel?: number,
    followUpDays?: number
  ) => {
    if (!selectedFileId || !processedPubs.length) return;

    const updatedPubs = processedPubs.map((pub) => ({
      ...pub,
      listType: type,
      Priority:
        type === "wins"
          ? "RepslyWin"
          : type === "hitlist"
          ? "Wishlist"
          : type === "unvisited"
          ? "Unvisited"
          : "Masterfile",
      deadline,
      priorityLevel,
      followUpDays: type === "wins" ? followUpDays : undefined,
    }));

    setUserFiles(
      (prev: UserFiles): UserFiles => ({
        files: prev.files.map((f) =>
          f.fileId === selectedFileId
            ? {
                ...f,
                type,
                deadline,
                priority: priorityLevel,
                followUpDays: type === "wins" ? followUpDays : undefined,
              }
            : f
        ),
        pubs: [
          ...prev.pubs.filter((p) => p.fileId !== selectedFileId),
          ...updatedPubs,
        ],
      })
    );

    // Reset state
    setShowTypeDialog(false);
    setCurrentFileName("");
    setProcessedPubs([]);
    setSelectedFileId(null);
    setInitialValues(null);
  };

  const handleFileDelete = (fileId: string) => {
    const file = uploadedFiles.find((f) => f.fileId === fileId);
    if (!file) {
      console.warn("File not found for deletion:", fileId);
      return;
    }

    devLog("Deleting file:", file);

    switch (file.type) {
      case "masterhouse":
        setUserFiles((prev) => ({
          files: prev.files.filter((f) => f.fileId !== fileId),
          pubs: prev.pubs.filter((pub) => pub.fileId !== fileId),
        }));
        break;
      case "wins":
        setUserFiles((prev) => ({
          files: prev.files.filter((f) => f.fileId !== fileId),
          pubs: prev.pubs.filter((pub) => pub.fileId !== fileId),
        }));
        break;
      case "hitlist":
        setUserFiles((prev) => ({
          files: prev.files.filter((f) => f.fileId !== fileId),
          pubs: prev.pubs.filter((pub) => pub.fileId !== fileId),
        }));
        break;
      case "unvisited":
        setUserFiles((prev) => ({
          files: prev.files.filter((f) => f.fileId !== fileId),
          pubs: prev.pubs.filter((pub) => pub.fileId !== fileId),
        }));
        break;
      default:
        console.warn("Unknown file type:", file.type);
    }
  };

  // Update the files array in userFiles
  // const _updateUserFiles = (newFiles: FileMetadata[]) => {
  //   setUserFiles((prev: UserFiles) => ({
  //     ...prev,
  //     files: newFiles,
  //   }));
  // };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 backdrop-blur-sm rounded-lg p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-purple mx-auto mb-4"></div>
          <p className="text-eggplant-100">Initializing services...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 backdrop-blur-sm rounded-lg p-6 text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-eggplant-100 mb-2">
            Service Initialization Failed
          </h2>
          <p className="text-eggplant-200 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue bg-clip-text text-transparent animate-gradient-x">
        Prioritize Your House Lists
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        <div className="lg:col-span-9">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className={`lg:col-span-3 transition-all duration-300`}>
              <div className="animated-border bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 backdrop-blur-sm rounded-lg shadow-xl p-6 sm:p-8 mb-4 sm:mb-6">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setIsQuickStartExpanded(!isQuickStartExpanded)}
                >
                  <div>
                    <h2 className="text-xl font-bold mb-2 bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue bg-clip-text text-transparent">
                      Quick Start 🚀
                    </h2>
                    <p className="text-xs text-white/80">
                      Upload your territory data and let AI optimize your
                      schedule ✨
                    </p>
                  </div>
                  <button className="p-2 hover:bg-eggplant-800/50 rounded-lg transition-colors">
                    {isQuickStartExpanded ? (
                      <ChevronUp className="h-5 w-5 text-neon-purple" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-neon-purple" />
                    )}
                  </button>
                </div>

                <div
                  className={`space-y-4 overflow-hidden transition-all duration-300 ${
                    isQuickStartExpanded
                      ? "mt-6 max-h-[2000px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div
                    className={`transition-all duration-300 ${
                      activeStep === 1 ? "opacity-100" : "opacity-70"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3
                        className={`text-sm font-semibold mb-1.5 ${
                          activeStep === 1
                            ? "text-neon-purple"
                            : "text-eggplant-100"
                        }`}
                        onClick={() => activeStep >= 1 && setActiveStep(1)}
                        style={{
                          cursor: activeStep >= 1 ? "pointer" : "default",
                        }}
                      >
                        Step 1: Territory Import
                      </h3>
                      {activeStep > 1 && (
                        <button
                          onClick={() => setActiveStep(1)}
                          className="text-[10px] text-neon-purple hover:underline"
                        >
                          Edit
                        </button>
                      )}
                    </div>

                    {activeStep === 1 ? (
                      <>
                        <FileUploader
                          fileType="masterhouse"
                          isLoaded={masterfilePubs.length > 0}
                          isRequired={true}
                          isDisabled={activeStep !== 1}
                        />
                        {masterfilePubs.length > 0 ? (
                          <div className="flex items-center justify-between">
                            <p className="mt-1.5 text-[10px] text-green-200">
                              ✓ {masterfilePubs.length} accounts loaded
                            </p>
                            {activeStep === 1 && (
                              <button
                                onClick={() => setActiveStep(2)}
                                className="px-3 py-1 text-xs rounded-md bg-gradient-to-r from-neon-purple to-neon-blue text-white hover:shadow-neon-purple transition-all"
                              >
                                Next to Step 2
                              </button>
                            )}
                          </div>
                        ) : (
                          <p className="mt-1.5 text-[10px] text-eggplant-300">
                            No accounts loaded yet
                          </p>
                        )}
                      </>
                    ) : masterfilePubs.length > 0 ? (
                      <p className="mt-1.5 text-[10px] text-green-200">
                        ✓ {masterfilePubs.length} accounts loaded
                      </p>
                    ) : (
                      <p className="mt-1.5 text-[10px] text-eggplant-300">
                        No accounts loaded yet
                      </p>
                    )}
                  </div>

                  <div
                    className={`pt-2 border-t border-eggplant-800/30 transition-all duration-300 ${
                      masterfilePubs.length > 0
                        ? activeStep >= 2
                          ? "opacity-100"
                          : "opacity-70"
                        : "opacity-50 pointer-events-none"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3
                        className={`text-sm font-semibold mb-2 ${
                          activeStep === 2
                            ? "text-neon-purple"
                            : "text-eggplant-100"
                        }`}
                        onClick={() => activeStep >= 2 && setActiveStep(2)}
                        style={{
                          cursor: activeStep >= 2 ? "pointer" : "default",
                        }}
                      >
                        Step 2: Add Your Lists
                      </h3>
                      {activeStep > 2 && (
                        <button
                          onClick={() => setActiveStep(2)}
                          className="text-[10px] text-neon-purple hover:underline"
                        >
                          Edit
                        </button>
                      )}
                    </div>

                    {activeStep === 2 ? (
                      <>
                        {/* <EnhancementSelector
                          onFileLoaded={(type, pubs) => {
                            switch (type) {
                              case "wins":
                              case "hitlist":
                              case "unvisited":
                                setUserFiles((prev) => ({
                                  files: prev.files,
                                  pubs: [...prev.pubs, ...pubs],
                                }));
                                break;
                            }
                          }}
                          isDisabled={
                            !masterfilePubs.length || activeStep !== 2
                          }
                          maxFiles={5}
                          currentFiles={uploadedFiles}
                        /> */}
                        
                        <FileUploader
                          fileType="wins"  // any non-"masterhouse" value; you'll pick the real list type in the dialog
                          isLoaded={false}
                          isRequired={false}
                          isDisabled={!masterfilePubs.length || activeStep !== 2}
                          usedPriorities={usedPriorities}
                        />

                        <div className="mt-3 p-1.5 rounded-lg bg-eggplant-800/30 border border-eggplant-700/30">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] text-eggplant-200">
                              <span className="text-neon-purple">Pro Tip:</span>{" "}
                              Add your lists to optimize your schedule
                            </p>
                            {activeStep === 2 && (
                              <button
                                onClick={() => setActiveStep(3)}
                                className="px-3 py-1 text-xs rounded-md bg-gradient-to-r from-neon-purple to-neon-blue text-white hover:shadow-neon-purple transition-all"
                              >
                                Next to Step 3
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-[10px] text-eggplant-200 mb-2">
                        {uploadedFiles.filter((f) => f.type !== "masterhouse")
                          .length > 0
                          ? `✓ ${
                              uploadedFiles.filter(
                                (f) => f.type !== "masterhouse"
                              ).length
                            } list(s) uploaded`
                          : "Optional: Add additional lists to optimize schedule"}
                      </p>
                    )}
                  </div>

                  <div
                    className={`pt-2 border-t border-eggplant-800/30 transition-all duration-300 ${
                      masterfilePubs.length > 0
                        ? activeStep >= 3
                          ? "opacity-100"
                          : "opacity-70"
                        : "opacity-50 pointer-events-none"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3
                        className={`text-sm font-semibold mb-2 ${
                          activeStep === 3
                            ? "text-neon-purple"
                            : "text-eggplant-100"
                        }`}
                        onClick={() => activeStep >= 3 && setActiveStep(3)}
                        style={{
                          cursor: activeStep >= 3 ? "pointer" : "default",
                        }}
                      >
                        Step 3: Schedule Settings
                      </h3>
                      {activeStep > 3 && (
                        <button
                          onClick={() => setActiveStep(3)}
                          className="text-[10px] text-neon-purple hover:underline"
                        >
                          Edit
                        </button>
                      )}
                    </div>

                    {activeStep === 3 ? (
                      <ScheduleSettings
                        onGenerateSchedule={() => {
                          setActiveStep(4);
                        }}
                        isGenerating={isGenerating}
                        isDisabled={activeStep !== 3}
                      />
                    ) : (
                      <p className="text-[10px] text-eggplant-200 mb-2">
                        {homeAddress
                          ? `✓ Home: ${homeAddress} | ${visitsPerDay} visits per day | ${businessDays} week days`
                          : "Configure your schedule settings"}
                      </p>
                    )}
                  </div>

                  <div
                    className={`pt-2 border-t border-eggplant-800/30 transition-all duration-300 ${
                      masterfilePubs.length > 0 && homeAddress
                        ? activeStep >= 4
                          ? "opacity-100"
                          : "opacity-70"
                        : "opacity-50 pointer-events-none"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3
                        className={`text-sm font-semibold mb-2 ${
                          activeStep === 4
                            ? "text-neon-purple"
                            : "text-eggplant-100"
                        }`}
                        onClick={() => activeStep >= 4 && setActiveStep(4)}
                        style={{
                          cursor: activeStep >= 4 ? "pointer" : "default",
                        }}
                      >
                        Step 4: Choose Your Skin 👤
                      </h3>
                      {activeStep > 4 && (
                        <button
                          onClick={() => setActiveStep(4)}
                          className="text-[10px] text-neon-purple hover:underline"
                        >
                          Edit
                        </button>
                      )}
                    </div>

                    {activeStep === 4 ? (
                      <GenerateControls
                        onGenerate={async () => {
                          await generateSchedule();
                          setIsQuickStartExpanded(false);
                        }}
                      />
                    ) : (
                      <p className="text-[10px] text-eggplant-200 mb-2">
                        {selectedVehicle && selectedVehicleColor
                          ? `✓ Selected ${selectedVehicleColor} ${selectedVehicle}`
                          : "Choose your Monopoly piece and color"}
                      </p>
                    )}
                  </div>

                  <div className="mt-6">
                    <UploadedFilesPanel
                      files={uploadedFiles}
                      onEdit={handleFileEdit}
                      onDelete={activeStep <= 2 ? handleFileDelete : undefined}
                      maxFiles={6}
                    />
                    {showTypeDialog && (
                      <FileTypeDialog
                        isOpen={showTypeDialog}
                        onClose={() => {
                          setShowTypeDialog(false);
                          setCurrentFileName("");
                          setProcessedPubs([]);
                          setSelectedFileId(null);
                          setInitialValues(null);
                        }}
                        onSubmit={handleTypeDialogSubmit}
                        error={error}
                        setError={setError}
                        fileType={initialValues?.type || ""}
                        currentFileName={currentFileName}
                        initialValues={initialValues}
                        isEditing={true}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!isQuickStartExpanded && <ScheduleDisplay />}
        </div>

        <div className="lg:col-span-3 space-y-6">
          <RepStatsPanel />
          <UnscheduledPubsPanel
            pubs={userFiles.pubs}
            selectedPub={selectedPub}
            onScheduleAnyway={handleScheduleAnyway}
            scheduledPubs={schedule.flatMap((day) => day.visits)}
          />
        </div>
      </div>
    </div>
  );
};

export default PlannerDashboard;
