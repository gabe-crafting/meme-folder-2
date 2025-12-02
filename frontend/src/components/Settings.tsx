import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { GetSettings, UpdateSettings } from '../../wailsjs/go/main/App';

export interface SettingsData {
  videoMemoryLimitMB: number;
  imageMemoryLimitMB: number;
}

export function Settings() {
  const [settings, setSettings] = useState<SettingsData>({
    videoMemoryLimitMB: 10,
    imageMemoryLimitMB: 20,
  });
  const [tempSettings, setTempSettings] = useState<SettingsData>(settings);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const loaded = await GetSettings();
        setSettings(loaded);
        setTempSettings(loaded);
      } catch (err) {
        console.error('Failed to load settings:', err);
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
    }
  };

  const handleCancel = () => {
    setTempSettings(settings);
    setHasChanges(false);
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
    </div>
  );
}

