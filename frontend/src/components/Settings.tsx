import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, Folder, RotateCcw, AlertCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { GetSettings, UpdateSettings, GetConfigPath, SetCustomConfigPath, ResetConfigPath, SelectDirectory } from '../../wailsjs/go/main/App';

export interface SettingsData {
  videoMemoryLimitMB: number;
  imageMemoryLimitMB: number;
  customConfigPath: string;
}

export function Settings() {
  const [settings, setSettings] = useState<SettingsData>({
    videoMemoryLimitMB: 10,
    imageMemoryLimitMB: 20,
    customConfigPath: '',
  });
  const [tempSettings, setTempSettings] = useState<SettingsData>(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [currentConfigPath, setCurrentConfigPath] = useState<string>('');
  const [errors, setErrors] = useState<string[]>([]);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  // Load settings and config path on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const loaded = await GetSettings();
        setSettings(loaded);
        setTempSettings(loaded);
        
        // Also load current config path
        const configPath = await GetConfigPath();
        setCurrentConfigPath(configPath);
      } catch (err) {
        console.error('Failed to load settings:', err);
        const errorMsg = `Failed to load settings: ${err}`;
        setErrors(prev => [...prev, errorMsg]);
      }
    };

    void loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      await UpdateSettings(tempSettings.videoMemoryLimitMB, tempSettings.imageMemoryLimitMB);
      setSettings(tempSettings);
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to save settings:', err);
      const errorMsg = `Failed to save settings: ${err}`;
      setErrors(prev => [...prev, errorMsg]);
    }
  };

  const handleCancel = () => {
    setTempSettings(settings);
    setHasChanges(false);
  };

  const handleSelectConfigPath = async () => {
    try {
      const selected = await SelectDirectory('Select Config Directory');
      
      if (selected) {
        await SetCustomConfigPath(selected);
        const newPath = await GetConfigPath();
        setCurrentConfigPath(newPath);
        alert('Config location changed successfully. Please restart the app for full effect.');
      }
    } catch (err) {
      console.error('Failed to set config path:', err);
      const errorMsg = `Failed to change config location: ${err}`;
      setErrors(prev => [...prev, errorMsg]);
      alert('Failed to change config location: ' + err);
    }
  };

  const handleResetConfigPath = async () => {
    try {
      await ResetConfigPath();
      const newPath = await GetConfigPath();
      setCurrentConfigPath(newPath);
      alert('Config location reset to default. Please restart the app for full effect.');
    } catch (err) {
      console.error('Failed to reset config path:', err);
      const errorMsg = `Failed to reset config location: ${err}`;
      setErrors(prev => [...prev, errorMsg]);
      alert('Failed to reset config location: ' + err);
    }
  };

  useEffect(() => {
    setHasChanges(
      tempSettings.videoMemoryLimitMB !== settings.videoMemoryLimitMB ||
      tempSettings.imageMemoryLimitMB !== settings.imageMemoryLimitMB
    );
  }, [tempSettings, settings]);

  return (
    <div className="border-t border-sidebar-border">
      <Accordion type="single" collapsible>
        <AccordionItem value="settings" className="border-none">
          <AccordionTrigger className="px-4 py-2 hover:no-underline">
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              <span className="text-sm font-semibold">Settings</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              {/* Video Memory Limit */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Video Memory Limit (MB)
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={tempSettings.videoMemoryLimitMB}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      setTempSettings({
                        ...tempSettings,
                        videoMemoryLimitMB: Math.min(50, Math.max(1, value)),
                      });
                    }}
                    className="h-8"
                  />
                  <span className="text-xs text-muted-foreground">Max: 50</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Videos larger than this won't load
                </p>
              </div>

              {/* Image Memory Limit */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Image Memory Limit (MB)
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={tempSettings.imageMemoryLimitMB}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      setTempSettings({
                        ...tempSettings,
                        imageMemoryLimitMB: Math.min(100, Math.max(1, value)),
                      });
                    }}
                    className="h-8"
                  />
                  <span className="text-xs text-muted-foreground">Max: 100</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Images larger than this won't load
                </p>
              </div>

              {/* Config File Location */}
              <div className="space-y-2 pt-2 border-t border-border">
                <label className="text-xs font-medium text-muted-foreground">
                  Config File Location
                </label>
                <div className="space-y-2">
                  <Input
                    type="text"
                    value={currentConfigPath}
                    readOnly
                    className="h-8 text-xs"
                    title={currentConfigPath}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleSelectConfigPath()}
                      className="flex-1"
                    >
                      <Folder className="h-3 w-3 mr-1" />
                      Change
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleResetConfigPath()}
                      className="flex-1"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Reset
                    </Button>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Change where settings, favorites, and tags are stored
                </p>
              </div>

              {/* Save/Cancel Buttons */}
              {hasChanges && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => void handleSave()}
                    className="flex-1"
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Error Button */}
      {errors.length > 0 && (
        <div className="p-2 border-t border-sidebar-border">
          <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                className="w-full"
                size="sm"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                {errors.length} Error{errors.length > 1 ? 's' : ''} Detected
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-destructive">Configuration Errors</DialogTitle>
                <DialogDescription>
                  The following errors occurred:
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {errors.map((error, index) => (
                  <div
                    key={index}
                    className="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm"
                  >
                    {error}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setErrors([])}
                  className="flex-1"
                >
                  Clear Errors
                </Button>
                <Button
                  onClick={() => setShowErrorDialog(false)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}

