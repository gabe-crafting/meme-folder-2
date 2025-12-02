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

// serveImageMiddleware is a middleware that serves images from local filesystem
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

			// Check if file exists
			info, err := os.Stat(filePath)
			if err != nil || info.IsDir() {
				http.Error(w, "File not found", http.StatusNotFound)
				return
			}

			// Open and serve the file
			file, err := os.Open(filePath)
			if err != nil {
				http.Error(w, "Cannot read file", http.StatusInternalServerError)
				return
			}
			defer file.Close()

			// Set content type based on extension
			ext := strings.ToLower(filepath.Ext(filePath))
			contentType := "image/jpeg"
			switch ext {
			case ".png":
				contentType = "image/png"
			case ".gif":
				contentType = "image/gif"
			case ".webp":
				contentType = "image/webp"
			case ".bmp":
				contentType = "image/bmp"
			}

			w.Header().Set("Content-Type", contentType)
			w.Header().Set("Cache-Control", "public, max-age=3600")
			io.Copy(w, file)
			return
		}

		// Not a /wails-image/ request, pass to next handler
		next.ServeHTTP(w, r)
	})
}
