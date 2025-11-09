import type { FileMetadata } from '../context/PubDataContext';

export function normalizeFileMetadata(f: any): FileMetadata {
  const base: FileMetadata = {
    fileId: String(f.fileId ?? crypto.randomUUID()),
    fileName: String(f.fileName ?? 'Unknown.xlsx'),
    type: (['masterhouse','hitlist','wins','unvisited'].includes(f.type) ? f.type : 'hitlist') as FileMetadata['type'],
    count: Number.isFinite(f.count) ? Number(f.count) : 0,
    name: String(f.name ?? f.fileName ?? 'Unknown.xlsx'),
    uploadTime: Number.isFinite(f.uploadTime) ? Number(f.uploadTime) : Date.now(),
  };

  const hasPriority = typeof f.priorityLevel === 'number';
  const hasDeadline = typeof f.deadline === 'string' && f.deadline.trim() !== '';
  const hasFollowup = typeof f.followUpDays === 'number' && f.followUpDays > 0;

  if (hasPriority) {
    return { 
      ...base, 
      schedulingMode: 'priority', 
      priorityLevel: f.priorityLevel, 
      priority: f.priorityLevel,
      type: 'hitlist' 
    };
  }
  if (hasDeadline) {
    return { 
      ...base, 
      schedulingMode: 'deadline', 
      deadline: String(f.deadline), 
      type: 'hitlist' 
    };
  }
  if (hasFollowup) {
    return { 
      ...base, 
      schedulingMode: 'followup', 
      followUpDays: Number(f.followUpDays), 
      type: 'wins' 
    };
  }
  // default if nothing is set
  return { 
    ...base, 
    schedulingMode: 'priority', 
    type: 'hitlist' 
  };
}
