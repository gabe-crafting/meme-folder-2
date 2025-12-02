package main

import (
	"embed"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "meme-folder-",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets:     assets,
			Middleware: serveImageMiddleware,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}

// serveImageMiddleware is a middleware that serves images and videos from local filesystem
func serveImageMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Check if request is for /wails-image/
		if strings.HasPrefix(r.URL.Path, "/wails-image/") {
			// Extract file path (everything after /wails-image/)
			filePath := strings.TrimPrefix(r.URL.Path, "/wails-image/")

			// URL decode the path
			filePath = strings.ReplaceAll(filePath, "%2F", "/")
			filePath = strings.ReplaceAll(filePath, "%5C", "\\")

			// Security: Prevent directory traversal
			filePath = filepath.Clean(filePath)
			if strings.Contains(filePath, "..") {
				http.Error(w, "Invalid path", http.StatusBadRequest)
				return
			}

			// Check if file exists and get size
			info, err := os.Stat(filePath)
			if err != nil || info.IsDir() {
				http.Error(w, "File not found", http.StatusNotFound)
				return
			}

			// Get settings to check file size limits
			settings, err := (&App{}).GetSettings()
			if err != nil {
				settings = defaultSettings
			}

			// Determine file type and check size limit
			ext := strings.ToLower(filepath.Ext(filePath))
			fileSizeMB := float64(info.Size()) / (1024 * 1024)
			isVideo := false

			switch ext {
			case ".mp4", ".webm", ".mkv", ".avi", ".mov", ".wmv", ".flv", ".m4v":
				isVideo = true
				if fileSizeMB > float64(settings.VideoMemoryLimitMB) {
					http.Error(w, "Video file too large", http.StatusRequestEntityTooLarge)
					return
				}
			case ".png", ".jpg", ".jpeg", ".jfif", ".gif", ".webp", ".bmp":
				if fileSizeMB > float64(settings.ImageMemoryLimitMB) {
					http.Error(w, "Image file too large", http.StatusRequestEntityTooLarge)
					return
				}
			}

			// Open and serve the file
			file, err := os.Open(filePath)
			if err != nil {
				http.Error(w, "Cannot read file", http.StatusInternalServerError)
				return
			}
			defer file.Close()

			// Set content type based on extension
			contentType := "image/jpeg"
			if isVideo {
				switch ext {
				case ".mp4", ".m4v":
					contentType = "video/mp4"
				case ".webm":
					contentType = "video/webm"
				case ".mkv":
					contentType = "video/x-matroska"
				case ".avi":
					contentType = "video/x-msvideo"
				case ".mov":
					contentType = "video/quicktime"
				case ".wmv":
					contentType = "video/x-ms-wmv"
				case ".flv":
					contentType = "video/x-flv"
				}
			} else {
				switch ext {
				case ".png":
					contentType = "image/png"
				case ".gif":
					contentType = "image/gif"
				case ".webp":
					contentType = "image/webp"
				case ".bmp":
					contentType = "image/bmp"
				case ".jfif":
					contentType = "image/jpeg"
				}
			}

			w.Header().Set("Content-Type", contentType)
			w.Header().Set("Cache-Control", "public, max-age=3600")
			w.Header().Set("Accept-Ranges", "bytes")
			io.Copy(w, file)
			return
		}

		// Not a /wails-image/ request, pass to next handler
		next.ServeHTTP(w, r)
	})
}
