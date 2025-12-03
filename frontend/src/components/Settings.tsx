import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, RotateCcw } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { GetConfigPath } from '../../wailsjs/go/main/App';

export interface SettingsData {
  videoMemoryLimitMB: number;
  imageMemoryLimitMB: number;
}

const SETTINGS_KEY = 'meme-folder-settings';

const defaultSettings: SettingsData = {
  videoMemoryLimitMB: 10,
  imageMemoryLimitMB: 20,
};

export function Settings() {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [tempSettings, setTempSettings] = useState<SettingsData>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [currentConfigPath, setCurrentConfigPath] = useState<string>('');

  // Load settings from localStorage and config path on mount
  useEffect(() => {
    // Load settings from localStorage
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed });
        setTempSettings({ ...defaultSettings, ...parsed });
      }
    } catch (err) {
      console.error('Failed to load settings from localStorage:', err);
    }

    // Load current config path
    const loadConfigPath = async () => {
      try {
        const configPath = await GetConfigPath();
        setCurrentConfigPath(configPath);
      } catch (err) {
        console.error('Failed to load config path:', err);
      }
    };

    void loadConfigPath();
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(tempSettings));
      setSettings(tempSettings);
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to save settings to localStorage:', err);
    }
  };

  const handleCancel = () => {
    setTempSettings(settings);
    setHasChanges(false);
  };

  const handleResetToDefaults = () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset memory limits to defaults?\n\n' +
      'This will reset:\n' +
      '- Video Memory Limit to 10 MB\n' +
      '- Image Memory Limit to 20 MB'
    );
    
    if (!confirmed) {
      return;
    }
    
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
      setSettings(defaultSettings);
      setTempSettings(defaultSettings);
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to reset settings:', err);
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

              {/* Config File Path Display */}
              <div className="space-y-2 pt-2 border-t border-border">
                <label className="text-xs font-medium text-muted-foreground">
                  Config File Location
                </label>
                <Input
                  type="text"
                  value={currentConfigPath}
                  readOnly
                  className="h-8 text-xs bg-muted cursor-default"
                  title={currentConfigPath}
                />
              </div>

              {/* Save/Cancel Buttons */}
              {hasChanges && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={handleSave}
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

              {/* Reset to Defaults */}
              <div className="space-y-2 pt-2 border-t border-border">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetToDefaults}
                  className="w-full"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset to Defaults
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

