import React, { createContext, useState, useContext, ReactNode } from 'react';
import { useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface FileMetadata {
  fileId: string;
  fileName: string;
  type: string;
  uploadTime: number;
  priority?: number;
  deadline?: string;
  followUpDays?: number;
}

interface UserFiles {
  files: FileMetadata[];
  pubs: Pub[];
}

export interface Pub {
  id?: string;
  pub: string;
  zip: string;
  install_date?: string;
  last_visited?: string | null;
  short_post?: string;
  rtm?: string;
  landlord?: string;
  notes?: string;
  Priority?: string;
  zip_prefix?: string;
  zip_numeric?: number;
  win_date?: string;
  win_type?: string;
  scheduledTime?: string;
  visitNotes?: string;
  isBooked?: boolean;
  deadline?: string;
  priorityLevel?: number;
  fileName?: string;
  fileId?: string;
  uploadTime?: number;
  followUpDays?: number;
  listType?: string;
}

export interface PubDataContextType {
  userFiles: UserFiles;
  schedule: ScheduleDay[];
  businessDays: number;
  visitsPerDay: number;
  homeAddress: string;
  setUserFiles: (files: UserFiles) => void;
  setSchedule: (schedule: ScheduleDay[]) => void;
  setBusinessDays: (days: number) => void;
  setVisitsPerDay: (visits: number) => void;
  setHomeAddress: (address: string) => void;
  resetAllData: () => void;
  addPubList: (pubs: Pub[], type: string, fileName: string, deadline?: string) => void;
  removePubList: (fileName: string) => void;
  updatePubList: (fileName: string, updates: Partial<Pub>) => void;
}

export interface ScheduleDay {
  date: string;
  visits: ScheduleVisit[];
  totalMileage?: number;
  totalDriveTime?: number;
  startMileage?: number;
  startDriveTime?: number;
  endMileage?: number;
  endDriveTime?: number;
  schedulingErrors?: string[];
}

export interface ScheduleVisit extends Pub {
  mileageToNext?: number;
  driveTimeToNext?: number;
}

const PubDataContext = createContext<PubDataContextType | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  PubDataContext.displayName = 'PubDataContext';
}

// Separate hook into named function declaration for Fast Refresh compatibility
export function usePubData() {
  const context = useContext(PubDataContext);
  if (context === undefined) {
    console.warn('usePubData must be used within a PubDataProvider');
    return {
      wishlistPubs: [],
      unvisitedPubs: [],
      masterfilePubs: [],
      repslyWins: [],
      schedule: [],
      businessDays: 0,
      visitsPerDay: 5,
      homeAddress: '',
      repslyDeadline: '',
      setWishlistPubs: () => {},
      setUnvisitedPubs: () => {},
      setMasterfilePubs: () => {},
      setRepslyWins: () => {},
      setSchedule: () => {},
      setBusinessDays: () => {},
      setVisitsPerDay: () => {},
      setHomeAddress: () => {},
      setRepslyDeadline: () => {},
      resetAllData: () => {},
      addPubList: () => {},
      removePubList: () => {},
      updatePubList: () => {}
    };
  }
  return context;
}

export const PubDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state from localStorage if available
  const [userFiles, setUserFiles] = useState<UserFiles>(() => {
    try {
      const saved = localStorage.getItem('userFiles');
      return saved ? JSON.parse(saved) : { files: [], pubs: [] };
    } catch (e) {
      return { files: [], pubs: [] };
    }
  });
  const [schedule, setSchedule] = useState<ScheduleDay[]>(() => {
    try {
      const saved = localStorage.getItem('schedule');
      const parsed = saved ? JSON.parse(saved) : [];
      console.log('Loaded initial schedule:', parsed);
      return parsed;
    } catch (e) {
      console.error('Error loading schedule from localStorage:', e);
      return [];
    }
  });
  const [businessDays, setBusinessDays] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('businessDays');
      return saved ? parseInt(saved) : 100;
    } catch (e) {
      return 100;
    }
  });
  const [visitsPerDay, setVisitsPerDay] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('visitsPerDay');
      return saved ? parseInt(saved) : 5;
    } catch (e) {
      return 5;
    }
  });
  const [homeAddress, setHomeAddress] = useState<string>(() => {
    try {
      return localStorage.getItem('homeAddress') || "";
    } catch (e) {
      return "";
    }
  });

  const resetAllData = useCallback(() => {
    setUserFiles({ files: [], pubs: [] });
    setSchedule([]);
    setBusinessDays(100);
    setVisitsPerDay(5);
    setHomeAddress("");
    
    // Clear localStorage
    localStorage.removeItem('userFiles');
    localStorage.removeItem('schedule');
    localStorage.removeItem('businessDays');
    localStorage.removeItem('visitsPerDay');
    localStorage.removeItem('homeAddress');
  }, []);

  // Reset data on mount
  useEffect(() => {
    resetAllData();
  }, [resetAllData]);

  // Persist state changes to localStorage
  useEffect(() => {
    try {
      // Only save if schedule has actual content
      if (!schedule || schedule.length === 0) return;
      
      // Debounce the save operation
      const saveTimeout = setTimeout(() => {
        console.debug('Saving schedule to localStorage');
        localStorage.setItem('schedule', JSON.stringify(schedule));
      }, 1000);
      return () => clearTimeout(saveTimeout);
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
    }
  }, [schedule]);

  // Add a new pub list
  const addPubList = (pubs: Pub[], type: string, fileName: string, deadline?: string) => {
    // Generate a single fileId for the entire list
    const fileId = uuidv4();
    const uploadTime = Date.now();
    
    console.debug('Adding pub list:', {
      type,
      fileName,
      pubCount: pubs.length,
      deadline
    });

    const pubsWithMetadata = pubs.map(pub => ({
      ...pub,
      fileName,
      fileId,
      listType: type,
      uploadTime
    }));
    
    const fileMetadata: FileMetadata = {
      fileId,
      fileName,
      type,
      uploadTime,
      ...(deadline && { deadline }),
    };

    setUserFiles(prev => {
      // Create new arrays to ensure state updates properly
      const updatedFiles = [...prev.files, fileMetadata];
      const updatedPubs = [...prev.pubs, ...pubsWithMetadata];
      
      console.debug('Updating user files:', {
        prevFilesCount: prev.files.length,
        newFilesCount: updatedFiles.length,
        prevPubsCount: prev.pubs.length,
        newPubsCount: updatedPubs.length
      });
      
      return {
        files: updatedFiles,
        pubs: updatedPubs
      };
    });
  };

  // Remove a pub list by filename
  const removePubList = (fileId: string) => {
    setUserFiles(prev => ({
      files: prev.files.filter(file => file.fileId !== fileId),
      pubs: prev.pubs.filter(pub => pub.fileId !== fileId)
    }));
  };

  // Update a pub list
  const updatePubList = (fileId: string, updates: Partial<Pub>) => {
    setUserFiles(prev => ({
      ...prev,
      pubs: prev.pubs.map(pub => 
        pub.fileId === fileId ? { ...pub, ...updates } : pub
      )
    }));
  };

  // Extract pubs by type from userFiles
  const masterfilePubs = userFiles.pubs.filter(pub => pub.listType === 'masterhouse');
  const recentWins = userFiles.pubs.filter(pub => pub.listType === 'wins');
  const wishlistPubs = userFiles.pubs.filter(pub => pub.listType === 'hitlist');
  const unvisitedPubs = userFiles.pubs.filter(pub => pub.listType === 'unvisited');

  const value = React.useMemo(() => ({
    userFiles,
    schedule,
    businessDays,
    visitsPerDay,
    homeAddress,
    setUserFiles,
    setSchedule,
    setBusinessDays,
    setVisitsPerDay,
    setHomeAddress,
    addPubList,
    removePubList,
    updatePubList
  }), [
    userFiles,
    schedule,
    businessDays,
    visitsPerDay,
    homeAddress,
    resetAllData,
    addPubList,
    removePubList,
    updatePubList
  ]);

  return (
    <PubDataContext.Provider value={value}>
      {children}
    </PubDataContext.Provider>
  );
};