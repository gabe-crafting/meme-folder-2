package main

import (
	"context"
	"fmt"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Test config access on startup
	configPath, err := getConfigPath()
	if err != nil {
		runtime.LogErrorf(ctx, "Failed to get config path: %v", err)
		_, _ = runtime.MessageDialog(ctx, runtime.MessageDialogOptions{
			Type:    runtime.ErrorDialog,
			Title:   "Configuration Error",
			Message: fmt.Sprintf("Cannot access configuration directory:\n%v\n\nThe app may not save your settings.", err),
		})
		return
	}

	// Try to load/create config
	_, err = loadConfig()
	if err != nil {
		runtime.LogErrorf(ctx, "Failed to load config from %s: %v", configPath, err)
		_, _ = runtime.MessageDialog(ctx, runtime.MessageDialogOptions{
			Type:    runtime.WarningDialog,
			Title:   "Configuration Warning",
			Message: fmt.Sprintf("Cannot load configuration file:\n%s\n\nError: %v\n\nThe app will work but settings may not persist.", configPath, err),
		})
	}
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// SelectDirectory opens a directory picker dialog
func (a *App) SelectDirectory(title string) (string, error) {
	selection, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: title,
	})
	return selection, err
}
