import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import { loadAppState, saveAppState, clearAppState } from "../services/persistence";
import { devLog } from "../utils/devLog";
import { useAuth } from "./AuthContext";

// Ensure process.env is available
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production" | "test";
    }
  }
}

export type UUID = string;

export type ListType = "wins" | "hitlist" | "unvisited" | "masterhouse";

export interface Pub {
  uuid: UUID;
  fileId: string;
  fileName: string;
  listType: ListType;
  deadline?: string;
  priorityLevel?: number;
  followUpDays?: number;
  // Legacy field: "zip" is the historical postcode field in this codebase.
  // We keep it for compatibility and store normalized data in postcodeMeta.
  zip: string;
  // Full source row from import; used for pending-fix review and future audits.
  rawRow?: Record<string, any>;
  postcodeMeta?: {
    raw: string;
    normalized: string | null;
    areaLetters: string | null;
    outwardDistrict: number | null;
    outwardFull: string | null;
    inwardSector: string | null;
    inwardUnit: string | null;
    status: "OK" | "ODDBALL" | "INVALID";
    fallbackReason:
      | "UNKNOWN_MACRO"
      | "UNKNOWN_SUBREGION"
      | "PARSE_FAILED"
      | "SPECIAL_CASE"
      | "USER_DEFERRED_REVIEW"
      | null;
  };
  pub: string;
  mileageToNext?: number;
  driveTimeToNext?: number;
  last_visited?: string;
  rtm?: string;
  landlord?: string;
  notes?: string;
  scheduledTime?: string;
  visitNotes?: string;
  Priority?: string;
  
  // Source lists and scheduling mode (for clarity)
  sourceLists?: string[]; // unique list names (e.g., "Masterfile", "TNT Hitlist.xlsx", ...)
  schedulingMode?: 'priority' | 'deadline' | 'followup';
  
  // Lineage and effective plan fields (optional for backward compatibility)
  sources?: SourceRef[];
  fieldValuesBySource?: Record<string, Array<{ sourceId: string; value: string }>>;
  mergedExtras?: Record<string, Array<{ sourceId: string; value: string }>>;
  effectivePlan?: EffectivePlan;
}

// New types for lineage tracking
export interface SourceRef {
  sourceId: string;
  fileId: string;
  fileName: string;
  rowIndex: number;
  schedulingMode?: 'priority' | 'deadline' | 'followup';
  priority?: number;
  deadline?: string;
  followUpDays?: number;
  mapped: Record<string, string>; // Original mapped values
  extras: Record<string, string>; // Any additional fields
}

export interface EffectivePlan {
  deadline?: string;
  priorityLevel?: number;
  followUpDays?: number;
  listNames: string[];
}

export interface BusinessHours {
  openTime: string;
  closeTime: string;
}

export interface ScheduleDay {
  pub: string;
  arrival: Date;
  departure: Date;
  businessHours: BusinessHours;
  Priority: string;
  mileageToNext: number;
  driveTimeToNext: number;
  uuid: string;
  fileId: string;
  fileName: string;
  listType: ListType;
  deadline?: string;
  priorityLevel?: number;
  visitNotes?: string;

  date?: string;
  visits?: Pub[];
  totalMileage?: number;
  totalDriveTime?: number;
  startMileage?: number;
  startDriveTime?: number;
  endMileage?: number;
  endDriveTime?: number;
  schedulingErrors?: string[];
}

export type SchedulingDebugSummary = {
  bucketTotals: {
    deadline: number;
    followUp: number;
    priority: number;
    master: number;
  };
  bucketScheduled: {
    deadline: number;
    followUp: number;
    priority: number;
    master: number;
  };
  bucketExcluded: {
    deadline: number;
    followUp: number;
    priority: number;
    master: number;
  };
  exclusionReasons: {
    radiusConstrained: number;
    invalidGeo: number;
    capacityLimit: number;
    alreadyScheduled: number;
  };
  anchorMode: "home" | "fallback";
  daysRequested: number;
  scheduledDays: number;
  visitsPerDay: number;
  totalPubs: number;
  totalScheduled: number;
  notes?: string;
};

export interface FileMetadata {
  fileId: string;
  fileName: string;
  type: ListType;
  count: number;
  priority?: number;
  priorityLevel?: number;
  deadline?: string;
  color?: string;
  name: string;
  followUpDays?: number;
  uploadTime?: number;
  schedulingMode?: 'priority' | 'deadline' | 'followup';
}

export interface ExtendedPub extends Pub {
  Priority?: string;
  uploadTime?: number;
}

export interface UserFiles {
  pubs: ExtendedPub[];
  files: FileMetadata[];
}

export type VehicleType =
  | "car"
  | "truck"
  | "bike"
  | "bus"
  | "train"
  | "plane"
  | "boat"
  | "fairy";
export type VehicleColor =
  | "purple"
  | "blue"
  | "pink"
  | "green"
  | "orange"
  | "yellow";

export interface PubDataContextType {
  userFiles: UserFiles;
  schedule: ScheduleDay[];
  visitsPerDay: number;
  businessDays: number;
  homeAddress: string;
  searchRadius: number;
  selectedVehicle: VehicleType;
  selectedVehicleColor: VehicleColor;
  selectedDate: Date;
  schedulingDebug: SchedulingDebugSummary | null;
  setUserFiles: (files: UserFiles | ((prev: UserFiles) => UserFiles)) => void;
  setSchedule: (schedule: ScheduleDay[]) => void;
  setSchedulingDebug: (summary: SchedulingDebugSummary | null) => void;
  setBusinessDays: (days: number) => void;
  setVisitsPerDay: (visits: number) => void;
  setHomeAddress: (address: string) => void;
  setSearchRadius: (radius: number) => void;
  setSelectedVehicle: (vehicle: VehicleType) => void;
  setSelectedVehicleColor: (color: VehicleColor) => void;
  setSelectedDate: (date: Date) => void;
  resetAllData: () => void;
  clearAllData: () => void;
  signOutAndReset: () => void;
  isInitialized: boolean;
  initializationError: string | null;
}

const STORAGE_KEYS = {
  USER_FILES: "userFiles",
  SCHEDULE: "schedule",
  BUSINESS_DAYS: "businessDays",
  VISITS_PER_DAY: "visitsPerDay",
  HOME_ADDRESS: "homeAddress",
  SEARCH_RADIUS: "searchRadius",
  VEHICLE_TYPE: "vehicleType",
  VEHICLE_COLOR: "vehicleColor",
  SELECTED_DATE: "selectedDate",
} as const;

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    devLog(`Error loading ${key} from storage:`, error);
    return defaultValue;
  }
};

const saveToStorage = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    devLog(`Error saving ${key} to storage:`, error);
  }
};

const defaultContext: PubDataContextType = {
  userFiles: { pubs: [], files: [] },
  schedule: [],
  visitsPerDay: 5,
  businessDays: 5,
  homeAddress: "",
  searchRadius: 15,
  selectedVehicle: "car",
  selectedVehicleColor: "purple",
  selectedDate: new Date(),
  schedulingDebug: null,
  setUserFiles: () => {},
  setSchedule: () => {},
  setSchedulingDebug: () => {},
  setBusinessDays: () => {},
  setVisitsPerDay: () => {},
  setHomeAddress: () => {},
  setSearchRadius: () => {},
  setSelectedVehicle: () => {},
  setSelectedVehicleColor: () => {},
  setSelectedDate: () => {},
  resetAllData: () => {},
  clearAllData: () => {},
  signOutAndReset: () => {},
  isInitialized: false,
  initializationError: null,
};

export const PubDataContext = createContext<PubDataContextType>(defaultContext);

export const usePubData = (): PubDataContextType => {
  const context = useContext(PubDataContext);
  if (!context) {
    throw new Error("usePubData must be used within a PubDataProvider");
  }
  return context;
};



const INITIALIZATION_TIMEOUT = 2000; // 2 seconds timeout for initialization

export const PubDataProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { userId } = useAuth();
  
  // Initial state constant
  const initialState: UserFiles = { files: [], pubs: [] };
  
  // Track which userId we've loaded data for
  const rehydratedFor = useRef<string>('');
  
  // Initialize state with persisted values
  const [userFiles, setUserFiles] = useState<UserFiles>(initialState);
  const [schedule, setSchedule] = useState<ScheduleDay[]>(() =>
    loadFromStorage(STORAGE_KEYS.SCHEDULE, [])
  );
  const [businessDays, setBusinessDays] = useState<number>(() =>
    loadFromStorage(STORAGE_KEYS.BUSINESS_DAYS, 5)
  );
  const [visitsPerDay, setVisitsPerDay] = useState<number>(() =>
    loadFromStorage(STORAGE_KEYS.VISITS_PER_DAY, 5)
  );
  const [homeAddress, setHomeAddress] = useState<string>(() =>
    loadFromStorage(STORAGE_KEYS.HOME_ADDRESS, "")
  );
  const [searchRadius, setSearchRadius] = useState<number>(() =>
    loadFromStorage(STORAGE_KEYS.SEARCH_RADIUS, 15)
  );
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>(
    loadFromStorage(STORAGE_KEYS.VEHICLE_TYPE, "car")
  );
  const [selectedVehicleColor, setSelectedVehicleColor] =
    useState<VehicleColor>(
      loadFromStorage(STORAGE_KEYS.VEHICLE_COLOR, "purple")
    );
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    loadFromStorage(STORAGE_KEYS.SELECTED_DATE, new Date())
  );
  const [schedulingDebug, setSchedulingDebug] =
    useState<SchedulingDebugSummary | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(
    null
  );

  // Re-hydrate when userId changes
  useEffect(() => {
    if (rehydratedFor.current !== userId) {
      try {
        const hydrated = loadAppState(userId);
        devLog('[PubDataContext] Hydrated state for userId:', userId, hydrated);
        setUserFiles(hydrated);
        rehydratedFor.current = userId;
      } catch (error) {
        devLog('[PubDataContext] Failed to hydrate for userId:', userId, error);
        setUserFiles(initialState);
        rehydratedFor.current = userId;
      }
    }
  }, [userId, initialState]);

  // Initialize context
  useEffect(() => {
    const initializeContext = async () => {
      try {
        // Add a small delay to ensure all state is properly loaded
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Validate loaded data
        if (typeof businessDays !== "number" || businessDays < 0) {
          setBusinessDays(5);
        }
        if (typeof visitsPerDay !== "number" || visitsPerDay < 0) {
          setVisitsPerDay(5);
        }
        if (
          typeof searchRadius !== "number" ||
          searchRadius < 5 ||
          searchRadius > 30
        ) {
          setSearchRadius(15);
        }

        // Set initialization flag
        setIsInitialized(true);
        setInitializationError(null);
      } catch (error) {
        devLog("Error initializing context:", error);
        setInitializationError(
          error instanceof Error
            ? error.message
            : "Failed to initialize application"
        );

        // Reset to default state on error
        resetAllData();
      }
    };

    const initializationTimeout = setTimeout(() => {
      if (!isInitialized) {
        setInitializationError("Initialization timed out");
        resetAllData();
        setIsInitialized(true); // Force initialization to prevent infinite loading
      }
    }, INITIALIZATION_TIMEOUT);

    initializeContext();

    return () => {
      clearTimeout(initializationTimeout);
    };
  }, []);

  // Persist state changes
  useEffect(() => {
    if (isInitialized && rehydratedFor.current === userId) {
      saveAppState(userFiles, userId);
      devLog('[PubDataContext] Saved state:', userFiles);
    }
  }, [userFiles, isInitialized, userId]);

  useEffect(() => {
    if (isInitialized) {
      saveToStorage(STORAGE_KEYS.SCHEDULE, schedule);
    }
  }, [schedule, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      saveToStorage(STORAGE_KEYS.BUSINESS_DAYS, businessDays);
    }
  }, [businessDays, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      saveToStorage(STORAGE_KEYS.VISITS_PER_DAY, visitsPerDay);
    }
  }, [visitsPerDay, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      saveToStorage(STORAGE_KEYS.HOME_ADDRESS, homeAddress);
    }
  }, [homeAddress, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      saveToStorage(STORAGE_KEYS.SEARCH_RADIUS, searchRadius);
    }
  }, [searchRadius, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      saveToStorage(STORAGE_KEYS.VEHICLE_TYPE, selectedVehicle);
    }
  }, [selectedVehicle, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      saveToStorage(STORAGE_KEYS.VEHICLE_COLOR, selectedVehicleColor);
    }
  }, [selectedVehicleColor, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      saveToStorage(STORAGE_KEYS.SELECTED_DATE, selectedDate);
    }
  }, [selectedDate, isInitialized]);

  const resetAllData = useCallback(() => {
    try {
      setUserFiles({ pubs: [], files: [] });
      setSchedule([]);
      setBusinessDays(5);
      setVisitsPerDay(5);
      setHomeAddress("");
      setSearchRadius(15);
      setSelectedVehicle("car");
      setSelectedVehicleColor("purple");
      setSelectedDate(new Date());
      setInitializationError(null);

      // Clear storage
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      devLog("Error resetting data:", error);
      setInitializationError("Failed to reset application data");
    }
  }, []);

  // const resetForUser = useCallback((targetUserId: string) => {
  //   setUserFiles(initialState);
  //   rehydratedFor.current = targetUserId;
  //   saveAppState(initialState, targetUserId);
  //   devLog('[PubDataContext] Reset for user:', targetUserId);
  // }, [initialState]);

  const clearAllData = useCallback(() => {
    clearAppState(userId);
    // clearMappings(userId); // TODO: Implement clearMappings function
    setUserFiles(initialState);
    devLog('[PubDataContext] Cleared all data for user:', userId);
  }, [userId, initialState]);

  const signOutAndReset = useCallback(() => {
    clearAllData();
    // Note: AuthContext.signOut() will be called separately to rotate userId
    devLog('[PubDataContext] Sign out and reset completed');
  }, [clearAllData]);

  const value: PubDataContextType = {
    userFiles,
    schedule,
    businessDays,
    visitsPerDay,
    homeAddress,
    searchRadius,
    selectedVehicle,
    selectedVehicleColor,
    selectedDate,
    schedulingDebug,
    setUserFiles,
    setSchedule,
    setSchedulingDebug,
    setBusinessDays,
    setVisitsPerDay,
    setHomeAddress,
    setSearchRadius,
    setSelectedVehicle,
    setSelectedVehicleColor,
    setSelectedDate,
    resetAllData,
    clearAllData,
    signOutAndReset,
    isInitialized,
    initializationError,
  };

  // Show error state if initialization failed
  if (initializationError) {
    return (
      <div className="min-h-screen bg-eggplant-900 flex items-center justify-center p-4">
        <div className="bg-eggplant-800 rounded-lg shadow-xl p-6 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-400" />
            <h2 className="text-xl font-semibold text-eggplant-100">
              Initialization Error
            </h2>
          </div>
          <p className="text-eggplant-200 mb-4">{initializationError}</p>
          <button
            onClick={() => {
              resetAllData();
              window.location.reload();
            }}
            className="bg-neon-purple text-white px-4 py-2 rounded hover:bg-neon-purple/90 transition-colors"
          >
            Reset and Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <PubDataContext.Provider value={value}>{children}</PubDataContext.Provider>
  );
};
