import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache storage keys
export const WEEKLY_CACHE_KEY = '@weekly_summaries_cache';
export const MONTHLY_CACHE_KEY = '@monthly_summaries_cache';
export const CACHE_EXPIRY_HOURS = 24; // Cache expires after 24 hours

export interface CachedSummary {
  id: string;
  summary: string;
  timestamp: number;
  entriesHash: string; // Hash of entry IDs to detect changes
}

// Generate hash from entries to detect changes
export const generateEntriesHash = (entries: any[]): string => {
  const entriesString = entries
    .map(e => `${e.id}-${e.date}-${(e.text || e.content || '').length}`)
    .sort()
    .join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < entriesString.length; i++) {
    const char = entriesString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
};

export const getCachedSummary = async (
  cacheKey: string, 
  id: string, 
  entriesHash: string
): Promise<string | null> => {
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (!cached) return null;

    const cacheData: Record<string, CachedSummary> = JSON.parse(cached);
    const cachedItem = cacheData[id];

    if (!cachedItem) return null;

    // Check if cache is expired
    const now = Date.now();
    const cacheAge = now - cachedItem.timestamp;
    const maxAge = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;

    if (cacheAge > maxAge) {
      // Cache expired, remove it
      delete cacheData[id];
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      return null;
    }

    // Check if entries have changed
    if (cachedItem.entriesHash !== entriesHash) {
      // Entries changed, cache is invalid
      delete cacheData[id];
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      return null;
    }

    return cachedItem.summary;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
};

export const setCachedSummary = async (
  cacheKey: string, 
  id: string, 
  summary: string, 
  entriesHash: string
): Promise<void> => {
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    const cacheData: Record<string, CachedSummary> = cached ? JSON.parse(cached) : {};

    cacheData[id] = {
      id,
      summary,
      timestamp: Date.now(),
      entriesHash,
    };

    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error writing cache:', error);
  }
};

export const clearExpiredCache = async (cacheKey: string): Promise<void> => {
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (!cached) return;

    const cacheData: Record<string, CachedSummary> = JSON.parse(cached);
    const now = Date.now();
    const maxAge = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;

    let hasChanges = false;
    Object.keys(cacheData).forEach(id => {
      const cacheAge = now - cacheData[id].timestamp;
      if (cacheAge > maxAge) {
        delete cacheData[id];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    }
  } catch (error) {
    console.error('Error clearing expired cache:', error);
  }
};