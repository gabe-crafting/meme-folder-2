package main

import (
	"os"
	"os/user"
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

	// Default file size limits (in MB)
	const videoLimitMB = 10
	const imageLimitMB = 20

	videoLimitBytes := int64(videoLimitMB) * 1024 * 1024
	imageLimitBytes := int64(imageLimitMB) * 1024 * 1024

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
		case ".png", ".jpg", ".jpeg", ".jfif", ".gif", ".webp", ".bmp":
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

// GetHomeDirectory returns the user's home directory
func (a *App) GetHomeDirectory() (string, error) {
	usr, err := user.Current()
	if err != nil {
		return "", err
	}
	return usr.HomeDir, nil
}
