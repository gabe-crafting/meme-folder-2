import { useEffect, useState } from 'react';
import { ListDir, GetHomeDirectory } from "../../wailsjs/go/main/App";
import { main } from "../../wailsjs/go/models";

export type FileEntry = main.FileEntry;

const UI_STATE_KEY = 'meme-folder-ui-state';

export function useFolderBrowser(initialPath?: string) {
  const [folderPath, setFolderPath] = useState(initialPath || '');
  const [items, setItems] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getParentPath = (path: string): string => {
    const trimmed = path.trim();
    if (!trimmed) return trimmed;

    // Already at drive root like "C:\" -> stay there
    if (/^[A-Za-z]:\\$/.test(trimmed)) {
      return trimmed;
    }

    const lastSep = trimmed.lastIndexOf('\\');

    // If no separator, or path is like "C:" without backslash, just return as-is
    if (lastSep < 0) {
      return trimmed;
    }

    // If separator is right after "C:" (index 2), parent should be "C:\"
    if (lastSep === 2) {
      return trimmed.slice(0, 3);
    }

    return trimmed.slice(0, lastSep);
  };

  const readFolder = async (path?: string) => {
    setLoading(true);
    setError(null);
    try {
      const target = (path ?? folderPath).trim();
      const result = await ListDir(target);
      setItems(result);
      setFolderPath(target);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? 'Failed to read folder');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const openParent = async () => {
    const parent = getParentPath(folderPath);
    if (parent !== folderPath) {
      await readFolder(parent);
    }
  };

  const enterFolder = async (entry: FileEntry) => {
    if (entry.type !== 'folder') return;
    const newPath = `${folderPath.replace(/\\+$/, '')}\\${entry.name}`;
    await readFolder(newPath);
  };

  // Load initial folder on mount
  useEffect(() => {
    const initializeFolder = async () => {
      let pathToLoad = initialPath;
      
      // If no initial path provided, try to get last path from localStorage
      if (!pathToLoad) {
        try {
          const stored = localStorage.getItem(UI_STATE_KEY);
          if (stored) {
            const uiState = JSON.parse(stored);
            pathToLoad = uiState.lastPath;
          }
        } catch (err) {
          console.error('Failed to get UI state from localStorage:', err);
        }
      }

      // If still no path, get home directory
      if (!pathToLoad) {
        try {
          pathToLoad = await GetHomeDirectory();
        } catch (err) {
          console.error('Failed to get home directory:', err);
          pathToLoad = 'C:\\'; // Fallback to C:\ on Windows
        }
      }
      
      setFolderPath(pathToLoad);
      await readFolder(pathToLoad);
    };

    void initializeFolder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    folderPath,
    setFolderPath,
    items,
    loading,
    error,
    readFolder,
    openParent,
    enterFolder,
    getParentPath,
  } as const;
}


