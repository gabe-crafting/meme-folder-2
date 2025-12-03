import { useState, useEffect } from 'react';
import { GetUIState, SaveUIState } from '../../wailsjs/go/main/App';

export interface UIState {
  lastPath: string;
  foldersCollapsed: boolean;
  showTags: boolean;
  showOnlyUntagged: boolean;
  sidebarOpen: boolean;
  hideInactiveTags: boolean;
  tagFilterIntersect: boolean;
}

export function useUIState() {
  const [uiState, setUIState] = useState<UIState>({
    lastPath: '',
    foldersCollapsed: false,
    showTags: true,
    showOnlyUntagged: false,
    sidebarOpen: true,
    hideInactiveTags: false,
    tagFilterIntersect: true,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load UI state on mount
  useEffect(() => {
    const loadUIState = async () => {
      try {
        const loaded = await GetUIState();
        setUIState(loaded);
        setIsLoaded(true);
      } catch (err) {
        console.error('Failed to load UI state:', err);
        setIsLoaded(true);
      }
    };

    void loadUIState();
  }, []);

  // Save UI state (debounced to avoid too many writes)
  const saveUIState = async (newState: Partial<UIState>) => {
    const updatedState = { ...uiState, ...newState };
    setUIState(updatedState);

    try {
      await SaveUIState(
        updatedState.lastPath,
        updatedState.foldersCollapsed,
        updatedState.showTags,
        updatedState.showOnlyUntagged,
        updatedState.sidebarOpen,
        updatedState.hideInactiveTags,
        updatedState.tagFilterIntersect
      );
    } catch (err) {
      console.error('Failed to save UI state:', err);
    }
  };

  return {
    uiState,
    saveUIState,
    isLoaded,
  };
}

