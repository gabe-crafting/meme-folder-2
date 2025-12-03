import { useState, useEffect } from 'react';

export interface UIState {
  lastPath: string;
  foldersCollapsed: boolean;
  showTags: boolean;
  showOnlyUntagged: boolean;
  sidebarOpen: boolean;
  hideInactiveTags: boolean;
  tagFilterIntersect: boolean;
}

const UI_STATE_KEY = 'meme-folder-ui-state';

const defaultUIState: UIState = {
  lastPath: '',
  foldersCollapsed: false,
  showTags: true,
  showOnlyUntagged: false,
  sidebarOpen: true,
  hideInactiveTags: false,
  tagFilterIntersect: true,
};

export function useUIState() {
  const [uiState, setUIState] = useState<UIState>(defaultUIState);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load UI state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(UI_STATE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUIState({ ...defaultUIState, ...parsed });
      }
    } catch (err) {
      console.error('Failed to load UI state from localStorage:', err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save UI state to localStorage
  const saveUIState = (newState: Partial<UIState>) => {
    const updatedState = { ...uiState, ...newState };
    setUIState(updatedState);

    try {
      localStorage.setItem(UI_STATE_KEY, JSON.stringify(updatedState));
    } catch (err) {
      console.error('Failed to save UI state to localStorage:', err);
    }
  };

  return {
    uiState,
    saveUIState,
    isLoaded,
  };
}

