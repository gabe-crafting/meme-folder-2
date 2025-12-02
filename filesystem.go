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
	Type     string `json:"type"`     // "folder" or "image"
	Size     int64  `json:"size"`     // bytes (0 for folders)
	Modified string `json:"modified"` // RFC3339 timestamp
}

// ListDir returns only folders and image files in the given path.
// Image files are filtered by extension (png, jpg, jpeg, gif, webp, bmp).
func (a *App) ListDir(path string) ([]FileEntry, error) {
	entries, err := os.ReadDir(path)
	if err != nil {
		return nil, err
	}

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
			result = append(result, FileEntry{
				Name:     entry.Name(),
				Type:     "image",
				Size:     info.Size(),
				Modified: modified,
			})
		default:
			// skip non-image files
			continue
		}
	}

	return result, nil
}

