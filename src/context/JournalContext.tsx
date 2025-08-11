import React, { createContext, useContext, useEffect, useState } from 'react';
import { addEntry as addStoreEntry, loadEntries, deleteEntry as del, search as query, clearAll } from '../services/storage';
import { Entry } from '../types/journalEntry';

type Ctx = {
  entries: Entry[];
  isLoading: boolean;
  addEntry: (text: string, tags: string[], audioUri?: string) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  searchEntries: (q: string) => Promise<Entry[]>;
  refreshEntries: () => Promise<void>;
  clearAllData: () => Promise<void>;
};

const JournalContext = createContext<Ctx | undefined>(undefined);

export function JournalProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshEntries() {
    const list = await loadEntries();
    setEntries(list);
  }

  useEffect(() => {
    (async () => { await refreshEntries(); setIsLoading(false); })();
  }, []);

  async function addEntry(text: string, tags: string[], audioUri?: string) {
    await addStoreEntry(text, tags, audioUri);
    await refreshEntries();
  }

  async function deleteEntry(id: string) {
    await del(id);
    await refreshEntries();
  }

  async function searchEntries(q: string) {
    return query(q);
  }

  async function clearAllData() {
    await clearAll();
    await refreshEntries();
  }

  return (
    <JournalContext.Provider value={{ entries, isLoading, addEntry, deleteEntry, searchEntries, refreshEntries, clearAllData }}>
      {children}
    </JournalContext.Provider>
  );
}

export function useJournal() {
  const ctx = useContext(JournalContext);
  if (!ctx) throw new Error('useJournal must be used within JournalProvider');
  return ctx;
}
