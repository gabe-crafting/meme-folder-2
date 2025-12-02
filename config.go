package main

import (
	"encoding/json"
	"os"
	"path/filepath"
)

// Favorite represents a favorited folder
type Favorite struct {
	Path    string `json:"path"`
	Name    string `json:"name"`
	AddedAt string `json:"addedAt"`
}

// Settings represents application settings
type Settings struct {
	VideoMemoryLimitMB int `json:"videoMemoryLimitMB"` // Max MB per video (default 10, max 50)
	ImageMemoryLimitMB int `json:"imageMemoryLimitMB"` // Max MB per image (default 20, max 100)
}

// Config represents the application configuration
type Config struct {
	Favorites []Favorite `json:"favorites"`
	Settings  Settings   `json:"settings"`
}

// Default settings
var defaultSettings = Settings{
	VideoMemoryLimitMB: 10,
	ImageMemoryLimitMB: 20,
}

const configFileName = "meme-folder-config.json"

// getConfigPath returns the path to the config file
func getConfigPath() (string, error) {
	// Get user config directory
	configDir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}

	// Create app-specific directory
	appConfigDir := filepath.Join(configDir, "meme-folder")
	if err := os.MkdirAll(appConfigDir, 0755); err != nil {
		return "", err
	}

	return filepath.Join(appConfigDir, configFileName), nil
}

// loadConfig loads the configuration from disk
func loadConfig() (*Config, error) {
	configPath, err := getConfigPath()
	if err != nil {
		return nil, err
	}

	// If config doesn't exist, return default config
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		return &Config{
			Favorites: []Favorite{},
			Settings:  defaultSettings,
		}, nil
	}

	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, err
	}

	var config Config
	if err := json.Unmarshal(data, &config); err != nil {
		return nil, err
	}

	// Ensure favorites is initialized
	if config.Favorites == nil {
		config.Favorites = []Favorite{}
	}

	// Apply default settings if not set or invalid
	if config.Settings.VideoMemoryLimitMB == 0 {
		config.Settings.VideoMemoryLimitMB = defaultSettings.VideoMemoryLimitMB
	}
	if config.Settings.ImageMemoryLimitMB == 0 {
		config.Settings.ImageMemoryLimitMB = defaultSettings.ImageMemoryLimitMB
	}

	// Enforce max limits
	if config.Settings.VideoMemoryLimitMB > 50 {
		config.Settings.VideoMemoryLimitMB = 50
	}
	if config.Settings.ImageMemoryLimitMB > 100 {
		config.Settings.ImageMemoryLimitMB = 100
	}

	return &config, nil
}

// saveConfig saves the configuration to disk
func saveConfig(config *Config) error {
	configPath, err := getConfigPath()
	if err != nil {
		return err
	}

	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(configPath, data, 0644)
}

// GetFavorites returns all favorite folders
func (a *App) GetFavorites() ([]Favorite, error) {
	config, err := loadConfig()
	if err != nil {
		return nil, err
	}
	return config.Favorites, nil
}

// AddFavorite adds a folder to favorites
func (a *App) AddFavorite(path, name, addedAt string) error {
	config, err := loadConfig()
	if err != nil {
		return err
	}

	// Check if already exists
	for _, fav := range config.Favorites {
		if fav.Path == path {
			return nil // Already exists
		}
	}

	// Add new favorite
	config.Favorites = append(config.Favorites, Favorite{
		Path:    path,
		Name:    name,
		AddedAt: addedAt,
	})

	return saveConfig(config)
}

// RemoveFavorite removes a folder from favorites
func (a *App) RemoveFavorite(path string) error {
	config, err := loadConfig()
	if err != nil {
		return err
	}

	// Filter out the favorite to remove
	newFavorites := []Favorite{}
	for _, fav := range config.Favorites {
		if fav.Path != path {
			newFavorites = append(newFavorites, fav)
		}
	}

	config.Favorites = newFavorites
	return saveConfig(config)
}

// IsFavorite checks if a path is in favorites
func (a *App) IsFavorite(path string) (bool, error) {
	config, err := loadConfig()
	if err != nil {
		return false, err
	}

	for _, fav := range config.Favorites {
		if fav.Path == path {
			return true, nil
		}
	}

	return false, nil
}

// GetSettings returns the current settings
func (a *App) GetSettings() (Settings, error) {
	config, err := loadConfig()
	if err != nil {
		return defaultSettings, err
	}
	return config.Settings, nil
}

// UpdateSettings updates the application settings
func (a *App) UpdateSettings(videoLimitMB, imageLimitMB int) error {
	// Enforce limits
	if videoLimitMB < 1 {
		videoLimitMB = 1
	}
	if videoLimitMB > 50 {
		videoLimitMB = 50
	}
	if imageLimitMB < 1 {
		imageLimitMB = 1
	}
	if imageLimitMB > 100 {
		imageLimitMB = 100
	}

	config, err := loadConfig()
	if err != nil {
		return err
	}

	config.Settings.VideoMemoryLimitMB = videoLimitMB
	config.Settings.ImageMemoryLimitMB = imageLimitMB

	return saveConfig(config)
}
