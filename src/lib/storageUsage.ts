import { INDEX_KEY, LEGACY_VERSIONS_KEY, LEGACY_WORKSPACE_KEY, SNAPSHOTS_KEY } from './migrations';

const encoder = new TextEncoder();
export type StoragePressure = { level: 'info' | 'advisory' | 'elevated'; message: string };

/** Uses only WeaveStudio-owned bytes; browser quotas vary and are never assumed. */
export const getStoragePressure = (bytes: number): StoragePressure => {
  if (bytes >= 5 * 1024 * 1024) return { level: 'elevated', message: 'This browser has a large amount of WeaveStudio data. Export a full backup before adding more work or clearing browser data.' };
  if (bytes >= 2 * 1024 * 1024) return { level: 'advisory', message: 'Your local WeaveStudio data is growing. Download a full backup to keep a portable copy.' };
  return { level: 'info', message: 'This measures WeaveStudio-owned records only. Browser storage limits vary by browser and device.' };
};
export const isWeaveStudioKey = (key: string) => key === INDEX_KEY || key === LEGACY_VERSIONS_KEY || key === LEGACY_WORKSPACE_KEY || key === SNAPSHOTS_KEY || key.startsWith('weavestudio_v1_ws_') || key === 'weavestudio_coach_dismissed';
export const getStorageUsage = () => {
  let bytes = 0; let keys = 0;
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && isWeaveStudioKey(key)) { bytes += encoder.encode(key).length + encoder.encode(localStorage.getItem(key) ?? '').length; keys += 1; }
  }
  return { bytes, keys };
};
export const formatStorageUsage = (bytes: number) => bytes < 1024 ? `${bytes} bytes` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
