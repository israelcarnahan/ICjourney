import React, { useState, useEffect } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { mapsService } from '../config/maps';
import { planVisits, calculateDistance } from '../utils/scheduleUtils';
import FilePreview from '../components/FilePreview';
import FileUploader from '../components/FileUploader';
import ScheduleSettings from '../components/ScheduleSettings';
import ScheduleDisplay from '../components/ScheduleDisplay';
import UnscheduledPubsPanel from '../components/UnscheduledPubsPanel';
import RepStatsPanel from '../components/RepStatsPanel';
import FileTypeDialog from '../components/FileTypeDialog';
import EnhancementSelector from '../components/EnhancementSelector';
import { usePubData } from '../context/PubDataContext';

const PlannerDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unscheduledPubs, setUnscheduledPubs] = useState<Pub[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [selectedPub, setSelectedPub] = useState<Pub | null>(null);
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [currentFileName, setCurrentFileName] = useState('');
  const [processedPubs, setProcessedPubs] = useState<Pub[]>([]);
  const [isQuickStartExpanded, setIsQuickStartExpanded] = useState(true);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [initialValues, setInitialValues] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Clear schedule before generating new one
  const clearSchedule = () => {
    setSchedule([]);
    setUnscheduledPubs([]);
  };

  const { 
    userFiles,
    setUserFiles,
    businessDays,
    schedule,
    setSchedule,
    homeAddress,
    visitsPerDay
  } = usePubData();

  // Extract pubs by type from userFiles
  const masterfilePubs = userFiles.pubs.filter(pub => pub.listType === 'masterhouse');
  const repslyWins = userFiles.pubs.filter(pub => pub.listType === 'wins');
  const wishlistPubs = userFiles.pubs.filter(pub => pub.listType === 'hitlist');
  const unvisitedPubs = userFiles.pubs.filter(pub => pub.listType === 'unvisited');

  // Get deadline from wins file if it exists
  const repslyDeadline = userFiles.files.find(f => f.type === 'wins')?.deadline;

  const generateSchedule = async () => {
    console.log('Generate schedule triggered');
    setIsGenerating(true);
    setError(null);

    try {
      // Get all wins files and check if any are missing deadlines
      const winsFiles = userFiles.files.filter(f => f.type === 'wins');
      const winsWithoutDeadline = winsFiles.filter(f => !f.deadline);
      
      if (winsFiles.length > 0 && winsWithoutDeadline.length > 0) {
        setError("Please set a follow-up deadline for Recent Wins");
        setIsGenerating(false);
        return;
      }

      if (!homeAddress) {
        setError("Please enter your home address postcode");
        setIsGenerating(false);
        return;
      }

      // Collapse quick start section when generating schedule
      setIsQuickStartExpanded(false);

      // Clear previous schedule
      setSchedule([]);
      setUnscheduledPubs([]);
      
      // Get all pubs with their respective deadlines from file metadata
      const repslyWins = userFiles.pubs.filter(pub => pub.listType === 'wins');
      const repslyDeadlines = new Map(
        userFiles.files
          .filter(f => f.type === 'wins')
          .map(f => [f.fileId, f.deadline])
      );

      const processedRepslyWins = repslyWins.map(pub => ({
        ...pub,
        Priority: 'RecentWin',
        followUpDate: pub.fileId ? repslyDeadlines.get(pub.fileId) : undefined
      }));
      
      const wishlistPubs = userFiles.pubs.filter(pub => pub.listType === 'hitlist');
      const unvisitedPubs = userFiles.pubs.filter(pub => pub.listType === 'unvisited');
      const masterfilePubs = userFiles.pubs.filter(pub => pub.listType === 'masterhouse');

      const allPubs = [
        ...processedRepslyWins,
        ...wishlistPubs.map(pub => ({ ...pub, Priority: 'Wishlist' })),
        ...unvisitedPubs.map(pub => ({ ...pub, Priority: 'Unvisited' })),
        ...masterfilePubs.map(pub => ({ ...pub, Priority: 'Masterfile' }))
      ];

      if (allPubs.length === 0) {
        setError("No pubs available to schedule");
        setIsGenerating(false);
        return;
      }

      console.log('Generating new schedule with:', {
        pubs: allPubs.length,
        days: businessDays,
        home: homeAddress,
        visitsPerDay
      });

      const newSchedule = await planVisits(
        allPubs,
        new Date(),
        businessDays,
        homeAddress,
        visitsPerDay
      );

      console.log('Generated schedule:', newSchedule);
      setSchedule(newSchedule);
    } catch (err) {
      console.error('Error generating schedule:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate schedule');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleScheduleAnyway = (pub: Pub) => {
    console.debug('Adding pub to schedule:', pub);
    
    // Validate pub data
    if (schedule.some(day => day.visits.some(visit => visit.pub === pub.pub))) {
      console.warn('Pub already scheduled:', pub.pub);
      return;
    }

    if (!pub || !pub.zip) {
      console.warn('Invalid pub data:', pub);
      return;
    }
    
    // Find the selected day or first day with available space
    const dayIndex = selectedDay 
      ? schedule.findIndex(day => day.date === selectedDay)
      : schedule.findIndex(day => day.visits.length < visitsPerDay);
    
    if (dayIndex === -1) {
      console.warn('No days with available space');
      setError('No available space in schedule');
      return;
    }
    
    const dayWithSpace = schedule[dayIndex];
    
    // Check if day is already at capacity
    if (dayWithSpace.visits.length >= visitsPerDay) {
      console.warn('Day is at capacity:', dayWithSpace.date);
      setError(`Cannot add more visits to ${dayWithSpace.date} - day is at capacity`);
      return;
    }

    const visits = [...dayWithSpace.visits];
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
      Priority: pub.Priority || 'Unvisited',
      mileageToNext: 0,
      driveTimeToNext: 0
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
        endDriveTime: driveTimeToHome
      };
    });
    
    setSelectedDay(dayWithSpace.date);
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
        console.error('Maps initialization error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize maps service';
        console.error('Detailed error:', errorMessage);
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    initializeMaps();
  }, []);

  // Update uploaded files when pub lists change
  useEffect(() => {
    if (!userFiles?.pubs?.length) return;
    
    console.log('Updating uploaded files with:', {
      masterfile: masterfilePubs.map(p => ({ id: p.fileId, name: p.fileName })),
      wins: repslyWins.map(p => ({ id: p.fileId, name: p.fileName })),
      wishlist: wishlistPubs.map(p => ({ id: p.fileId, name: p.fileName })),
      unvisited: unvisitedPubs.map(p => ({ id: p.fileId, name: p.fileName }))
    });

    const files = [];

    // Group pubs by fileId to handle multiple files of the same type
    const groupPubsByFile = (pubs: Pub[], type: string) => {
      if (!pubs.length) return [];
      
      // Create a map to group pubs by fileId
      const groups = new Map<string, Pub[]>();
      
      // Group pubs by their fileId
      pubs.forEach(pub => {
        if (!pub.fileId || !pub.fileName) return;
        const group = groups.get(pub.fileId) || [];
        groups.set(pub.fileId, [...group, pub]);
      });
      
      console.log(`Grouped ${type} pubs:`, {
        totalPubs: pubs.length,
        groups: groups.size
      });
      
      // Convert groups to array of file objects
      return Array.from(groups.entries()).map(([fileId, groupPubs]) => ({
        fileId,
        fileName: groupPubs[0].fileName,
        type,
        count: groupPubs.length,
        priority: groupPubs[0].deadline ? undefined : getPriorityLevel(type, groupPubs[0]),
        deadline: groupPubs[0].deadline || (type === 'wins' ? repslyDeadline : undefined),
        color: getFileColor(type),
        uploadTime: groupPubs[0].uploadTime
      }));
    };

    const getPriorityLevel = (type: string, pub: Pub): number => {
      switch (type) {
        case 'wins': return 1;
        case 'hitlist': return pub.priorityLevel || 2;
        case 'unvisited': return 3;
        default: return 4;
      }
    };

    const getFileColor = (type: string) => {
      switch (type) {
        case 'masterhouse': return 'bg-gray-900/20 border-gray-700/50';
        case 'wins': return 'bg-purple-900/20 border-purple-700/50';
        case 'hitlist': return 'bg-blue-900/20 border-blue-700/50';
        case 'unvisited': return 'bg-green-900/20 border-green-700/50';
        default: return 'bg-gray-900/20 border-gray-700/50';
      }
    };

    // Process each list type
    if (masterfilePubs.length > 0) {
      files.push(...groupPubsByFile(masterfilePubs, 'masterhouse').map(file => ({
        ...file,
        name: file.fileName || 'Territory List'
      })));
    }

    if (repslyWins.length > 0) {
      files.push(...groupPubsByFile(repslyWins, 'wins').map(file => ({
        ...file,
        name: file.fileName || 'Recent Wins'
      })));
    }

    if (wishlistPubs.length > 0) {
      files.push(...groupPubsByFile(wishlistPubs, 'hitlist').map(file => ({
        ...file,
        name: file.fileName || 'Hit List'
      })));
    }

    if (unvisitedPubs.length > 0) {
      files.push(...groupPubsByFile(unvisitedPubs, 'unvisited').map(file => ({
        ...file,
        name: file.fileName || 'Growth Opportunities'
      })));
    }

    // Sort by upload time (newest first) and priority
    const sortedFiles = files.sort((a, b) => {
      if (a.uploadTime !== b.uploadTime) {
        return (b.uploadTime || 0) - (a.uploadTime || 0);
      }
      return (a.priority || 4) - (b.priority || 4);
    });

    console.log('Setting uploaded files:', sortedFiles);
    setUploadedFiles(sortedFiles);
  }, [userFiles.pubs]);

  // Debug logging for file operations
  useEffect(() => {
    if (!uploadedFiles.length) return;
    
    console.log('Current uploaded files:', {
      files: uploadedFiles.map(f => ({
        name: f.name,
        type: f.type,
        count: f.count,
        fileId: f.fileId
      }))
    });
  }, [uploadedFiles]);

  const handleFileEdit = (fileId: string) => {
    const file = uploadedFiles.find(f => f.fileId === fileId);
    if (!file) {
      console.warn('File not found for editing:', fileId);
      return;
    }

    // Find the pubs associated with this file
    let pubsToEdit: Pub[] = [];
    switch (file.type) {
      case 'masterhouse':
        pubsToEdit = masterfilePubs.filter(p => p.fileId === fileId);
        break;
      case 'wins':
        pubsToEdit = repslyWins.filter(p => p.fileId === fileId);
        break;
      case 'hitlist':
        pubsToEdit = wishlistPubs.filter(p => p.fileId === fileId);
        break;
      case 'unvisited':
        pubsToEdit = unvisitedPubs.filter(p => p.fileId === fileId);
        break;
    }

    if (pubsToEdit.length === 0) {
      console.warn('No pubs found for file:', fileId);
      return;
    }

    // Get the first pub to extract common settings
    const firstPub = pubsToEdit[0];

    // Show the FileTypeDialog with current settings
    setShowTypeDialog(true);
    setCurrentFileName(firstPub.fileName || '');
    setProcessedPubs(pubsToEdit);
    setSelectedFileId(fileId);
    setInitialValues({
      type: file.type,
      deadline: firstPub.deadline,
      priorityLevel: firstPub.priorityLevel,
      followUpDays: firstPub.followUpDays
    });
  };

  const handleTypeDialogSubmit = (type: string, deadline?: string, priorityLevel?: number, followUpDays?: number) => {
    if (!selectedFileId || !processedPubs.length) return;

    const updatedPubs = processedPubs.map(pub => ({
      ...pub,
      listType: type,
      Priority: type === 'wins' ? 'RepslyWin' :
               type === 'hitlist' ? 'Wishlist' :
               type === 'unvisited' ? 'Unvisited' : 'Masterfile',
      deadline,
      priorityLevel,
      followUpDays
    }));

    // Update the appropriate list
    switch (type) {
      case 'masterhouse':
        setUserFiles(prev => ({
          files: prev.files,
          pubs: [
            ...prev.pubs.filter(p => p.fileId !== selectedFileId),
            ...updatedPubs
          ]
        }));
        break;
      case 'wins':
        setUserFiles(prev => ({
          files: prev.files,
          pubs: [
            ...prev.pubs.filter(p => p.fileId !== selectedFileId),
            ...updatedPubs
          ]
        }));
        break;
      case 'hitlist':
        setUserFiles(prev => ({
          files: prev.files,
          pubs: [
            ...prev.pubs.filter(p => p.fileId !== selectedFileId),
            ...updatedPubs
          ]
        }));
        break;
      case 'unvisited':
        setUserFiles(prev => ({
          files: prev.files,
          pubs: [
            ...prev.pubs.filter(p => p.fileId !== selectedFileId),
            ...updatedPubs
          ]
        }));
        break;
    }

    // Reset state
    setShowTypeDialog(false);
    setCurrentFileName('');
    setProcessedPubs([]);
    setSelectedFileId(null);
    setInitialValues(null);
  };

  const handleFileDelete = (fileId: string) => {
    const file = uploadedFiles.find(f => f.fileId === fileId);
    if (!file) {
      console.warn('File not found for deletion:', fileId);
      return;
    }

    console.log('Deleting file:', file);

    switch (file.type) {
      case 'masterhouse':
        setUserFiles(prev => ({
          files: prev.files.filter(f => f.fileId !== fileId),
          pubs: prev.pubs.filter(pub => pub.fileId !== fileId)
        }));
        break;
      case 'wins':
        setUserFiles(prev => ({
          files: prev.files.filter(f => f.fileId !== fileId),
          pubs: prev.pubs.filter(pub => pub.fileId !== fileId)
        }));
        break;
      case 'hitlist':
        setUserFiles(prev => ({
          files: prev.files.filter(f => f.fileId !== fileId),
          pubs: prev.pubs.filter(pub => pub.fileId !== fileId)
        }));
        break;
      case 'unvisited':
        setUserFiles(prev => ({
          files: prev.files.filter(f => f.fileId !== fileId),
          pubs: prev.pubs.filter(pub => pub.fileId !== fileId)
        }));
        break;
      default:
        console.warn('Unknown file type:', file.type);
    }
  };

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
          <h2 className="text-xl font-bold text-eggplant-100 mb-2">Service Initialization Failed</h2>
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
            <div className={`lg:col-span-2 transition-all duration-300 ${!isQuickStartExpanded && 'lg:col-span-3'}`}>
              <div className="animated-border bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 backdrop-blur-sm rounded-lg shadow-xl p-6 sm:p-8 mb-4 sm:mb-6">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setIsQuickStartExpanded(!isQuickStartExpanded)}
                >
                  <div>
                    <h2 className="text-xl font-bold mb-2 bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue bg-clip-text text-transparent">
                      Quick Start 🚀
                    </h2>
                    <p className="text-xs text-eggplant-200">
                      Upload your territory data and let AI optimize your schedule ✨
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
                
                <div className={`space-y-4 overflow-hidden transition-all duration-300 ${
                  isQuickStartExpanded ? 'mt-6 max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div>
                    <h3 className="text-sm font-semibold mb-1.5 text-eggplant-100">Step 1: Territory Import</h3>
                    <FileUploader 
                      fileType="masterfile"
                      isLoaded={masterfilePubs.length > 0}
                      description="Upload your complete territory list"
                      isRequired={true}
                    />
                    {masterfilePubs.length > 0 ? (
                      <p className="mt-1.5 text-[10px] text-green-200">
                        ✓ {masterfilePubs.length} accounts loaded
                      </p>
                    ) : (
                      <p className="mt-1.5 text-[10px] text-eggplant-300">
                        No accounts loaded yet
                      </p>
                    )}
                  </div>

                  {masterfilePubs.length > 0 && (
                    <div className="pt-2 border-t border-eggplant-800/30">
                      <h3 className="text-sm font-semibold mb-2 text-eggplant-100">
                        Step 2: Add Your Lists
                      </h3>
                      <EnhancementSelector
                        onFileLoaded={(type, pubs) => {
                          switch (type) {
                            case 'wins': 
                            case 'hitlist':
                            case 'unvisited':
                              setUserFiles(prev => ({
                                files: prev.files,
                                pubs: [...prev.pubs, ...pubs]
                              }));
                              break;
                          }
                        }}
                        isDisabled={!masterfilePubs.length}
                        maxFiles={5}
                        currentFiles={uploadedFiles}
                      />
                      
                      <div className="mt-3 p-1.5 rounded-lg bg-eggplant-800/30 border border-eggplant-700/30">
                        <p className="text-[10px] text-eggplant-200">
                          <span className="text-neon-purple">Pro Tip:</span> Add your lists to optimize your schedule
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6">
                    <FilePreview 
                      files={uploadedFiles}
                      onEdit={handleFileEdit}
                      onDelete={handleFileDelete}
                      maxFiles={6}
                    />
                    {showTypeDialog && (
                      <FileTypeDialog
                        isOpen={showTypeDialog}
                        onClose={() => {
                          setShowTypeDialog(false);
                          setCurrentFileName('');
                          setProcessedPubs([]);
                          setSelectedFileId(null);
                          setInitialValues(null);
                        }}
                        onSubmit={handleTypeDialogSubmit}
                        error={error}
                        setError={setError}
                        fileType={initialValues?.type || ''}
                        currentFileName={currentFileName}
                        initialValues={initialValues}
                        isEditing={true}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className={`transition-all duration-300 ${!isQuickStartExpanded && 'hidden'}`}>
              <ScheduleSettings 
                onGenerateSchedule={generateSchedule}
                isGenerating={isGenerating}
              />
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
          />
        </div>
      </div>
    </div>
  );
};

export default PlannerDashboard