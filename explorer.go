package main

import (
	"os/exec"
	"runtime"
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
