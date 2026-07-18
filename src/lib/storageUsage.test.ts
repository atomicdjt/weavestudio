import { describe, expect, it } from 'vitest';
import { getStoragePressure } from './storageUsage';

describe('getStoragePressure', () => {
  it('keeps an empty local workspace informational', () => {
    expect(getStoragePressure(0)).toMatchObject({ level: 'info' });
  });

  it('advises an export when owned records become substantial', () => {
    expect(getStoragePressure(2 * 1024 * 1024)).toMatchObject({ level: 'advisory' });
  });

  it('elevates guidance for unusually large owned records', () => {
    expect(getStoragePressure(5 * 1024 * 1024)).toMatchObject({ level: 'elevated' });
  });
});
