import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { ChevronLeft, ChevronRight, Plus, Copy, ExternalLink } from 'lucide-react';
import { GetImageTags, AddImageTag, RemoveImageTag, GetAllTags, OpenInExplorer, CopyImageToClipboard } from '../../wailsjs/go/main/App';
import { TagList } from './TagList';

type Props = {
  imagePath: string;
  imageName: string;
  folderPath: string;
  mediaType: string; // "image" or "video"
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
  onTagsChanged?: () => void; // Callback to notify parent of tag changes
  hideInactiveTags: boolean;
  onHideInactiveTagsChange: (value: boolean) => void;
};

export function ImageViewer({
  imagePath,
  imageName,
  folderPath,
  mediaType,
  onClose,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  onTagsChanged,
  hideInactiveTags,
  onHideInactiveTagsChange,
}: Props) {
  const mediaUrl = `/wails-image/${encodeURIComponent(imagePath.replace(/\\/g, '/'))}`;
  const isVideo = mediaType === 'video';
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  const [allFolderTags, setAllFolderTags] = useState<string[]>([]);

  // Load tags for current image
  useEffect(() => {
    const loadTags = async () => {
      setIsLoadingTags(true);
      try {
        const imageTags = await GetImageTags(folderPath, imageName);
        setTags(imageTags);
      } catch (err) {
        console.error('Failed to load tags:', err);
      } finally {
        setIsLoadingTags(false);
      }
    };

    void loadTags();
  }, [folderPath, imageName]);

  // Load all tags from folder
  useEffect(() => {
    const loadAllTags = async () => {
      try {
        const allTags = await GetAllTags(folderPath);
        const uniqueTags = new Set<string>();
        Object.values(allTags).forEach(imageTags => {
          imageTags.forEach(tag => uniqueTags.add(tag));
        });
        setAllFolderTags(Array.from(uniqueTags).sort());
      } catch (err) {
        console.error('Failed to load all tags:', err);
      }
    };

    void loadAllTags();
  }, [folderPath]);

  const handleToggleTag = async (tag: string) => {
    const isActive = tags.includes(tag);
    
    try {
      if (isActive) {
        // Remove tag
        await RemoveImageTag(folderPath, imageName, tag);
        setTags(tags.filter(t => t !== tag));
      } else {
        // Add tag
        await AddImageTag(folderPath, imageName, tag);
        setTags([...tags, tag]);
      }
      
      // Notify parent of tag change
      onTagsChanged?.();
    } catch (err) {
      console.error('Failed to toggle tag:', err);
    }
  };

  const handleAddNewTag = async () => {
    const tag = newTag.trim();
    if (!tag) return;

    try {
      await AddImageTag(folderPath, imageName, tag);
      setTags([...tags, tag]);
      setNewTag('');
      
      // Add to allFolderTags if not already there
      if (!allFolderTags.includes(tag)) {
        setAllFolderTags([...allFolderTags, tag].sort());
      }
      
      // Notify parent of tag change
      onTagsChanged?.();
    } catch (err) {
      console.error('Failed to add tag:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleAddNewTag();
    }
  };

  const handleCopyName = () => {
    navigator.clipboard.writeText(imageName);
  };

  const handleCopyPath = () => {
    const fullPath = `${folderPath}\\${imageName}`;
    navigator.clipboard.writeText(fullPath);
  };

  const handleOpenInExplorerClick = async () => {
    const fullPath = `${folderPath}\\${imageName}`;
    try {
      await OpenInExplorer(fullPath);
    } catch (err) {
      console.error('Failed to open in explorer:', err);
    }
  };

  const handleCopyImageClick = async () => {
    const fullPath = `${folderPath}\\${imageName}`;
    try {
      await CopyImageToClipboard(fullPath);
    } catch (err) {
      console.error('Failed to copy image:', err);
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && hasNext && onNext) {
        onNext();
      } else if (e.key === 'ArrowLeft' && hasPrevious && onPrevious) {
        onPrevious();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [onClose, onNext, onPrevious, hasNext, hasPrevious]);

  return (
    <div className="w-full h-full bg-background flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex-none flex flex-col gap-3 px-4 py-3 border-b border-border bg-card">
        {/* Title */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium truncate flex-1">{imageName}</h2>
        </div>

        {/* Tags Section */}
        <div className="flex flex-col gap-2">
          {/* Add New Tag Input */}
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Add new tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
              disabled={isLoadingTags}
            />
            <Button
              onClick={() => void handleAddNewTag()}
              disabled={!newTag.trim() || isLoadingTags}
              size="icon"
              title="Add new tag"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Display All Tags (unified) */}
          {allFolderTags.length > 0 && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  Tags (green = active, click to toggle):
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <label className="text-xs text-muted-foreground whitespace-nowrap">
                    Hide inactive
                  </label>
                  <Switch
                    checked={hideInactiveTags}
                    onCheckedChange={onHideInactiveTagsChange}
                  />
                </div>
              </div>
              <TagList
                allFolderTags={allFolderTags}
                tags={tags}
                newTag={newTag}
                hideInactiveTags={hideInactiveTags}
                onToggleTag={handleToggleTag}
              />
            </div>
          )}

          {/* Show message if no tags exist */}
          {allFolderTags.length === 0 && !isLoadingTags && (
            <div className="text-xs text-muted-foreground">
              No tags yet. Add one above!
            </div>
          )}
        </div>
      </div>

      {/* Media container */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
        <ContextMenu>
          <ContextMenuTrigger asChild>
            {isVideo ? (
              <video
                src={mediaUrl}
                controls
                autoPlay
                loop
                className="w-full h-full"
                style={{ objectFit: 'contain' }}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                src={mediaUrl}
                alt={imageName}
                className="w-full h-full object-contain"
              />
            )}
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={handleOpenInExplorerClick}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open in File Explorer
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={handleCopyName}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Name
            </ContextMenuItem>
            <ContextMenuItem onClick={handleCopyPath}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Full Path
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => void handleCopyImageClick()}>
              <Copy className="mr-2 h-4 w-4" />
              {isVideo ? 'Copy Video File' : 'Copy Image'}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {/* Navigation buttons */}
        {hasPrevious && onPrevious && (
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2"
            onClick={onPrevious}
            title="Previous (←)"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}

        {hasNext && onNext && (
          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2"
            onClick={onNext}
            title="Next (→)"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        )}
      </div>
    </div>
  );
}

