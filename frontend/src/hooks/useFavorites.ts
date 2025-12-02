import { useState, useEffect } from 'react';
import { GetFavorites, AddFavorite, RemoveFavorite, IsFavorite } from '../../wailsjs/go/main/App';

export interface Favorite {
  path: string;
  name: string;
  addedAt: string;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load favorites from backend on mount and when refreshKey changes
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const favs = await GetFavorites();
        setFavorites(favs || []);
      } catch (err) {
        console.error('Failed to load favorites:', err);
        setFavorites([]);
      }
    };

    void loadFavorites();
  }, [refreshKey]);

  const addFavorite = async (path: string) => {
    // Extract folder name from path
    const parts = path.split('\\');
    const name = parts[parts.length - 1] || path;
    const addedAt = new Date().toISOString();

    try {
      await AddFavorite(path, name, addedAt);
      setRefreshKey(prev => prev + 1); // Trigger reload
    } catch (err) {
      console.error('Failed to add favorite:', err);
    }
  };

  const removeFavorite = async (path: string) => {
    try {
      await RemoveFavorite(path);
      setRefreshKey(prev => prev + 1); // Trigger reload
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    }
  };

  const isFavorite = (path: string) => {
    return favorites.some(f => f.path === path);
  };

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
  };
}

