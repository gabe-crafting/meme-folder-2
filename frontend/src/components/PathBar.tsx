import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, FolderOpen } from 'lucide-react';

type Props = {
  folderPath: string;
  setFolderPath: (path: string) => void;
  loading: boolean;
  onOpen: () => void;
  onBack: () => void;
  canGoBack: boolean;
};

export function PathBar({
  folderPath,
  setFolderPath,
  loading,
  onOpen,
  onBack,
  canGoBack,
}: Props) {
  return (
    <div className="px-4 py-3 border-b border-border flex items-center gap-2">
      <Button
        type="button"
        onClick={onBack}
        variant="outline"
        size="icon"
        disabled={loading || !canGoBack}
        title="Go up one level"
        className="shrink-0"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <Input
        type="text"
        value={folderPath}
        onChange={(e) => setFolderPath(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onOpen();
          }
        }}
        placeholder="C:\Users\gabe\Desktop\notes"
        className="flex-1"
      />
      <Button
        type="button"
        onClick={onOpen}
        disabled={loading}
        className="shrink-0"
      >
        <FolderOpen className="h-4 w-4 mr-2" />
        {loading ? 'Reading…' : 'Open'}
      </Button>
    </div>
  );
}


