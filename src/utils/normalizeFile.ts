import type { FileMetadata } from '../context/PubDataContext';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export function normalizeFileMetadata(f: unknown): FileMetadata {
  const meta = isRecord(f) ? f : {};
  const priorityLevel = typeof meta.priorityLevel === 'number' ? meta.priorityLevel : undefined;
  const followUpDays = typeof meta.followUpDays === 'number' ? meta.followUpDays : undefined;
  const base: FileMetadata = {
    fileId: String(meta.fileId ?? crypto.randomUUID()),
    fileName: String(meta.fileName ?? 'Unknown.xlsx'),
    type: (['masterhouse','hitlist','wins','unvisited'].includes(String(meta.type)) ? meta.type : 'hitlist') as FileMetadata['type'],
    count: typeof meta.count === 'number' && Number.isFinite(meta.count) ? Number(meta.count) : 0,
    name: String(meta.name ?? meta.fileName ?? 'Unknown.xlsx'),
    uploadTime: typeof meta.uploadTime === 'number' && Number.isFinite(meta.uploadTime) ? Number(meta.uploadTime) : Date.now(),
  };

  const hasPriority = typeof priorityLevel === 'number';
  const hasDeadline = typeof meta.deadline === 'string' && meta.deadline.trim() !== '';
  const hasFollowup = typeof followUpDays === 'number' && followUpDays > 0;

  if (hasPriority) {
    return { 
      ...base, 
      schedulingMode: 'priority', 
      priorityLevel: priorityLevel, 
      priority: priorityLevel,
      type: 'hitlist' 
    };
  }
  if (hasDeadline) {
    return { 
      ...base, 
      schedulingMode: 'deadline', 
      deadline: String(meta.deadline), 
      type: 'hitlist' 
    };
  }
  if (hasFollowup) {
    return { 
      ...base, 
      schedulingMode: 'followup', 
      followUpDays: Number(followUpDays), 
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
