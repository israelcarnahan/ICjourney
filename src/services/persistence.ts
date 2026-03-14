import { getJSON, setJSON, remove } from '../utils/storage';
import { normalizeFileMetadata } from '../utils/normalizeFile';
import type { UserFiles, FileMetadata, Pub } from '../context/PubDataContext';
import type { ColumnMapping } from '../types/import';
import { devLog } from '../utils/devLog';

const VERSION = 'v1';

type PersistedAppState = {
  files: FileMetadata[];
  pubs: Pub[];
};

type PersistedMappings = Record<string, ColumnMapping>;

const CANONICAL_FIELDS: Array<keyof ColumnMapping> = [
  'name',
  'postcode',
  'rtm',
  'address',
  'town',
  'lat',
  'lng',
  'phone',
  'email',
  'notes',
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isColumnMapping = (value: unknown): value is ColumnMapping => {
  if (!isRecord(value)) return false;
  return CANONICAL_FIELDS.every((field) => {
    if (!Object.prototype.hasOwnProperty.call(value, field)) return false;
    const entry = value[field];
    return typeof entry === 'string' || entry === null;
  });
};

export function loadAppState(userId: string): UserFiles {
  try {
    const KEY_FILES = `jp.${VERSION}.userFiles::${userId}`;
    const raw = getJSON<PersistedAppState>(KEY_FILES, { files: [], pubs: [] });
    // migrate files to current shape safely
    const files = (raw.files ?? []).map(normalizeFileMetadata);
    const pubs = Array.isArray(raw.pubs) ? raw.pubs : [];
    return { files, pubs };
  } catch (error) {
    devLog('[Persistence] Failed to load app state for userId:', userId, error);
    return { files: [], pubs: [] };
  }
}

export function saveAppState(state: UserFiles, userId: string) {
  try {
    // files should already be normalized at write time (only one scheduling field)
    const KEY_FILES = `jp.${VERSION}.userFiles::${userId}`;
    setJSON(KEY_FILES, state);
  } catch (error) {
    devLog('[Persistence] Failed to save app state for userId:', userId, error);
  }
}

export function clearAppState(userId: string) {
  try {
    const KEY_FILES = `jp.${VERSION}.userFiles::${userId}`;
    remove(KEY_FILES);
  } catch (error) {
    devLog('[Persistence] Failed to clear app state for userId:', userId, error);
  }
}

export function loadMappings(userId: string): PersistedMappings {
  try {
    const KEY_MAPPINGS = `jp.${VERSION}.mappings::${userId}`;
    const raw = getJSON<unknown>(KEY_MAPPINGS, {});
    if (!isRecord(raw)) return {};
    const parsed: PersistedMappings = {};
    Object.entries(raw).forEach(([key, value]) => {
      if (isColumnMapping(value)) {
        parsed[key] = value;
      }
    });
    return parsed;
  } catch (error) {
    devLog('[Persistence] Failed to load mappings for userId:', userId, error);
    return {};
  }
}

export function saveMappings(map: PersistedMappings, userId: string) {
  try {
    const KEY_MAPPINGS = `jp.${VERSION}.mappings::${userId}`;
    setJSON(KEY_MAPPINGS, map);
  } catch (error) {
    devLog('[Persistence] Failed to save mappings for userId:', userId, error);
  }
}

/**
 * @ARCHIVED
 * Reason: Knip flags this symbol as unused (no internal/cross-file references).
 * Status: Roadmap/postpone. Keep for future resurrection.
 * Notes: Intended for reset flows to clear saved mapping state.
 */
function clearMappings(userId: string) {
  try {
    const KEY_MAPPINGS = `jp.${VERSION}.mappings::${userId}`;
    remove(KEY_MAPPINGS);
  } catch (error) {
    devLog('[Persistence] Failed to clear mappings for userId:', userId, error);
  }
}
void clearMappings;
