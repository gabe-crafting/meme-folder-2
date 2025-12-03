package main

import (
	"fmt"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

// OpenInExplorer opens the file or folder in the system's file explorer
func (a *App) OpenInExplorer(path string) error {
	var cmd *exec.Cmd

	switch runtime.GOOS {
	case "windows":
		// Use explorer.exe with /select to highlight the file
		cmd = exec.Command("explorer.exe", "/select,", path)
	case "darwin":
		// macOS
		cmd = exec.Command("open", "-R", path)
	case "linux":
		// Linux - open containing folder
		cmd = exec.Command("xdg-open", path)
	default:
		return nil
	}

	return cmd.Start()
}

// CopyImageToClipboard copies an image or video file to the system clipboard
func (a *App) CopyImageToClipboard(path string) error {
	var cmd *exec.Cmd
	isVideo := isVideoFile(path)
	isGif := isGifFile(path)

	switch runtime.GOOS {
	case "windows":
		if isVideo {
			// For videos, copy as file to clipboard
			psScript := fmt.Sprintf(`Set-Clipboard -Path '%s'`, path)
			cmd = exec.Command("powershell", "-Command", psScript)
		} else if isGif {
			// For GIFs, copy as image (first frame will be static, but file copy is better)
			psScript := fmt.Sprintf(`Set-Clipboard -Path '%s'`, path)
			cmd = exec.Command("powershell", "-Command", psScript)
		} else {
			// For regular images, copy as image data
			psScript := fmt.Sprintf(`Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; $img = [System.Drawing.Image]::FromFile('%s'); [System.Windows.Forms.Clipboard]::SetImage($img); $img.Dispose()`, path)
			cmd = exec.Command("powershell", "-Command", psScript)
		}
	case "darwin":
		if isVideo || isGif {
			// macOS - copy file
			cmd = exec.Command("osascript", "-e", fmt.Sprintf(`set the clipboard to (read (POSIX file "%s") as «class furl»)`, path))
		} else {
			// macOS - copy image data
			cmd = exec.Command("osascript", "-e", fmt.Sprintf(`set the clipboard to (read (POSIX file "%s") as «class PNGf»)`, path))
		}
	case "linux":
		if isVideo || isGif {
			// Linux - copy file path
			cmd = exec.Command("bash", "-c", fmt.Sprintf(`echo -n "file://%s" | xclip -selection clipboard -t text/uri-list`, path))
		} else {
			// Linux - copy image data
			cmd = exec.Command("xclip", "-selection", "clipboard", "-t", "image/png", "-i", path)
		}
	default:
		return fmt.Errorf("unsupported platform")
	}

	return cmd.Run()
}

// isVideoFile checks if the file is a video based on extension
func isVideoFile(path string) bool {
	ext := filepath.Ext(strings.ToLower(path))
	videoExts := []string{".mp4", ".webm", ".avi", ".mov", ".mkv", ".flv", ".wmv", ".m4v"}
	for _, videoExt := range videoExts {
		if ext == videoExt {
			return true
		}
	}
	return false
}

// isGifFile checks if the file is a GIF
func isGifFile(path string) bool {
	return strings.ToLower(filepath.Ext(path)) == ".gif"
}
