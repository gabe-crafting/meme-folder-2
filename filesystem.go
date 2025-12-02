package main

import (
	"os"
	"path/filepath"
	"strings"
	"time"
)

// FileEntry represents a folder or image file entry for the frontend.
type FileEntry struct {
	Name     string `json:"name"`
	Type     string `json:"type"`     // "folder", "image", or "video"
	Size     int64  `json:"size"`     // bytes (0 for folders)
	Modified string `json:"modified"` // RFC3339 timestamp
}

// ListDir returns only folders, image files, and video files in the given path.
// Image files are filtered by extension (png, jpg, jpeg, gif, webp, bmp).
// Video files are filtered by extension (mp4, webm, mkv, avi, mov, wmv, flv).
// Files that exceed the configured memory limits are filtered out.
func (a *App) ListDir(path string) ([]FileEntry, error) {
	entries, err := os.ReadDir(path)
	if err != nil {
		return nil, err
	}

	// Get settings for file size limits
	settings, err := a.GetSettings()
	if err != nil {
		// Use defaults if settings can't be loaded
		settings.VideoMemoryLimitMB = 10
		settings.ImageMemoryLimitMB = 20
	}

	videoLimitBytes := int64(settings.VideoMemoryLimitMB) * 1024 * 1024
	imageLimitBytes := int64(settings.ImageMemoryLimitMB) * 1024 * 1024

	// Initialise as empty slice so it serialises as [] instead of null
	result := make([]FileEntry, 0)
	for _, entry := range entries {
		info, err := entry.Info()
		if err != nil {
			continue
		}

		modified := info.ModTime().Format(time.RFC3339)

		if entry.IsDir() {
			result = append(result, FileEntry{
				Name:     entry.Name(),
				Type:     "folder",
				Size:     0,
				Modified: modified,
			})
			continue
		}

		ext := strings.ToLower(filepath.Ext(entry.Name()))
		switch ext {
		case ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp":
			// Skip images that exceed the limit
			if info.Size() > imageLimitBytes {
				continue
			}
			result = append(result, FileEntry{
				Name:     entry.Name(),
				Type:     "image",
				Size:     info.Size(),
				Modified: modified,
			})
		case ".mp4", ".webm", ".mkv", ".avi", ".mov", ".wmv", ".flv", ".m4v":
			// Skip videos that exceed the limit
			if info.Size() > videoLimitBytes {
				continue
			}
			result = append(result, FileEntry{
				Name:     entry.Name(),
				Type:     "video",
				Size:     info.Size(),
				Modified: modified,
			})
		default:
			// skip non-media files
			continue
		}
	}

	return result, nil
}
