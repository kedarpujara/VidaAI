import AsyncStorage from '@react-native-async-storage/async-storage';
import { Entry } from '../types/journal';
import { encryptString, decryptString } from './encryption';

const KEY = 'vida.entries.v1';

export async function loadEntries(): Promise<Entry[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    const list: Entry[] = Array.isArray(parsed) ? parsed : [];
    for (const e of list) {
      if (e.text && !e.text.startsWith('{PLAIN}')) {
        try { e.text = await decryptString(e.text); } catch {}
      }
    }
    return list.sort((a,b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  } catch {
    return [];
  }
}

async function saveAll(entries: Entry[]) {
  const copy = await Promise.all(entries.map(async e => ({
    ...e,
    text: e.text ? await encryptString(e.text) : ''
  })));
  await AsyncStorage.setItem(KEY, JSON.stringify(copy));
}

function makeId() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
}

export async function addEntry(text: string, tags: string[], audioUri?: string) {
  const entry: Entry = {
    id: makeId(),
    createdAt: new Date().toISOString(),
    text,
    tags,
    hasAudio: !!audioUri,
    audioUri
  };
  const cur = await loadEntries();
  const next = [entry, ...cur];
  await saveAll(next);
  return entry;
}

export async function deleteEntry(id: string) {
  const cur = await loadEntries();
  const next = cur.filter(e => e.id !== id);
  await saveAll(next);
}

export async function clearAll() {
  await AsyncStorage.removeItem(KEY);
}

export async function search(query: string): Promise<Entry[]> {
  const q = query.toLowerCase();
  const list = await loadEntries();
  return list.filter(e => 
    e.text.toLowerCase().includes(q) ||
    e.tags.some(t => t.toLowerCase().includes(q))
  );
}
