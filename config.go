package main

import (
	"encoding/json"
	"fmt"
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
	VideoMemoryLimitMB int    `json:"videoMemoryLimitMB"` // Max MB per video (default 10, max 50)
	ImageMemoryLimitMB int    `json:"imageMemoryLimitMB"` // Max MB per image (default 20, max 100)
	CustomConfigPath   string `json:"customConfigPath"`   // Custom location for config files (empty = use default)
}

// UIState represents the UI state to persist
type UIState struct {
	LastPath         string `json:"lastPath"`         // Last opened folder path
	FoldersCollapsed bool   `json:"foldersCollapsed"` // Folders accordion state
	ShowTags         bool   `json:"showTags"`         // Show tags switch state
	ShowOnlyUntagged bool   `json:"showOnlyUntagged"` // Untagged only switch state
	SidebarOpen      bool   `json:"sidebarOpen"`      // Sidebar collapsed state
	HideInactiveTags bool   `json:"hideInactiveTags"` // Hide inactive tags in image viewer
}

// Config represents the application configuration
type Config struct {
	Favorites []Favorite `json:"favorites"`
	Settings  Settings   `json:"settings"`
	UIState   UIState    `json:"uiState"`
}

// Default settings
var defaultSettings = Settings{
	VideoMemoryLimitMB: 10,
	ImageMemoryLimitMB: 20,
}

// Default UI state
var defaultUIState = UIState{
	LastPath:         "",
	FoldersCollapsed: false,
	ShowTags:         true,
	ShowOnlyUntagged: false,
	SidebarOpen:      true,
	HideInactiveTags: false,
}

const configFileName = "meme-folder-config.json"
const configLocationFile = "config-location.txt"

// getDefaultConfigDir returns the default config directory
func getDefaultConfigDir() (string, error) {
	configDir, err := os.UserConfigDir()
	if err != nil {
		return "", fmt.Errorf("failed to get user config directory: %w", err)
	}
	return filepath.Join(configDir, "meme-folder"), nil
}

// getConfigPath returns the path to the config file
func getConfigPath() (string, error) {
	// Get default config directory
	defaultConfigDir, err := getDefaultConfigDir()
	if err != nil {
		return "", err
	}

	// Ensure default directory exists (needed for pointer file)
	if err := os.MkdirAll(defaultConfigDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create config directory %s: %w", defaultConfigDir, err)
	}

	// Check if there's a custom location pointer file
	locationFile := filepath.Join(defaultConfigDir, configLocationFile)
	if data, err := os.ReadFile(locationFile); err == nil {
		customPath := string(data)
		if customPath != "" {
			// Use custom location
			customConfigDir := filepath.Clean(customPath)
			if err := os.MkdirAll(customConfigDir, 0755); err != nil {
				return "", fmt.Errorf("failed to create custom config directory %s: %w", customConfigDir, err)
			}
			return filepath.Join(customConfigDir, configFileName), nil
		}
	}

	// Use default location
	return filepath.Join(defaultConfigDir, configFileName), nil
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
			UIState:   defaultUIState,
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

	// Apply default UI state if empty
	if config.UIState.LastPath == "" && !config.UIState.ShowTags {
		// Looks like UI state wasn't saved, use defaults
		config.UIState = defaultUIState
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

// GetUIState returns the current UI state
func (a *App) GetUIState() (UIState, error) {
	config, err := loadConfig()
	if err != nil {
		return defaultUIState, err
	}
	return config.UIState, nil
}

// SaveUIState saves the UI state
func (a *App) SaveUIState(lastPath string, foldersCollapsed, showTags, showOnlyUntagged, sidebarOpen, hideInactiveTags bool) error {
	config, err := loadConfig()
	if err != nil {
		return err
	}

	config.UIState = UIState{
		LastPath:         lastPath,
		FoldersCollapsed: foldersCollapsed,
		ShowTags:         showTags,
		ShowOnlyUntagged: showOnlyUntagged,
		SidebarOpen:      sidebarOpen,
		HideInactiveTags: hideInactiveTags,
	}

	return saveConfig(config)
}

// GetConfigPath returns the config file path for diagnostics
func (a *App) GetConfigPath() (string, error) {
	return getConfigPath()
}

// GetDefaultConfigDir returns the default config directory path
func (a *App) GetDefaultConfigDir() (string, error) {
	return getDefaultConfigDir()
}

// SetCustomConfigPath changes the config file location
func (a *App) SetCustomConfigPath(newPath string) error {
	// Get current config
	currentConfig, err := loadConfig()
	if err != nil {
		return fmt.Errorf("failed to load current config: %w", err)
	}

	// Get current config file path
	oldConfigPath, err := getConfigPath()
	if err != nil {
		return fmt.Errorf("failed to get current config path: %w", err)
	}

	// Clean and validate new path
	newPath = filepath.Clean(newPath)
	if newPath == "" {
		return fmt.Errorf("config path cannot be empty")
	}

	// Create new directory if it doesn't exist
	if err := os.MkdirAll(newPath, 0755); err != nil {
		return fmt.Errorf("failed to create directory %s: %w", newPath, err)
	}

	// Get default config directory for pointer file
	defaultConfigDir, err := getDefaultConfigDir()
	if err != nil {
		return fmt.Errorf("failed to get default config directory: %w", err)
	}

	// Write new location to pointer file
	locationFile := filepath.Join(defaultConfigDir, configLocationFile)
	if err := os.WriteFile(locationFile, []byte(newPath), 0644); err != nil {
		return fmt.Errorf("failed to write location pointer file: %w", err)
	}

	// Write config to new location
	newConfigPath := filepath.Join(newPath, configFileName)
	if err := saveConfig(currentConfig); err != nil {
		return fmt.Errorf("failed to save config to new location: %w", err)
	}

	// Optionally remove old config file if it's different location
	if oldConfigPath != newConfigPath {
		_ = os.Remove(oldConfigPath) // Ignore error, it's just cleanup
	}

	return nil
}

// ResetConfigPath resets the config location back to default
func (a *App) ResetConfigPath() error {
	// Get current config
	currentConfig, err := loadConfig()
	if err != nil {
		return fmt.Errorf("failed to load current config: %w", err)
	}

	// Get default config directory
	defaultConfigDir, err := getDefaultConfigDir()
	if err != nil {
		return err
	}

	// Remove pointer file to use default location
	locationFile := filepath.Join(defaultConfigDir, configLocationFile)
	_ = os.Remove(locationFile) // Ignore error if file doesn't exist

	// Save config to default location
	if err := saveConfig(currentConfig); err != nil {
		return fmt.Errorf("failed to save config to default location: %w", err)
	}

	return nil
}
