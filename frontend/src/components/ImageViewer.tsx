import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { GetImageTags, AddImageTag, RemoveImageTag, GetAllTags } from '../../wailsjs/go/main/App';

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

  const handleAddTag = async () => {
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

  const handleRemoveTag = async (tagToRemove: string) => {
    try {
      await RemoveImageTag(folderPath, imageName, tagToRemove);
      setTags(tags.filter(tag => tag !== tagToRemove));
      
      // Notify parent of tag change
      onTagsChanged?.();
    } catch (err) {
      console.error('Failed to remove tag:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleAddTag();
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
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex flex-col gap-3 px-4 py-3 border-b border-border bg-card">
        {/* Title and Close Button */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium truncate flex-1 mr-4">{imageName}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            title="Close (Esc)"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Tags Section */}
        <div className="flex flex-col gap-2">
          {/* Add Tag Input */}
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Add a tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
              disabled={isLoadingTags}
            />
            <Button
              onClick={() => void handleAddTag()}
              disabled={!newTag.trim() || isLoadingTags}
              size="icon"
              title="Add tag"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Display Current Image Tags */}
          {tags.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Tags on this image:</span>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    onClick={() => void handleRemoveTag(tag)}
                    title="Click to remove"
                  >
                    {tag}
                    <X className="ml-1 h-3 w-3" />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Display All Available Tags */}
          {allFolderTags.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">All tags (click to add):</span>
              <div className="flex flex-wrap gap-1.5">
                {allFolderTags
                  .filter(tag => !tags.includes(tag)) // Only show tags not already on image
                  .filter(tag => 
                    newTag === '' || 
                    tag.toLowerCase().includes(newTag.toLowerCase())
                  ) // Filter by input text
                  .map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={async () => {
                        try {
                          await AddImageTag(folderPath, imageName, tag);
                          setTags([...tags, tag]);
                          setNewTag(''); // Clear input after adding
                          onTagsChanged?.();
                        } catch (err) {
                          console.error('Failed to add tag:', err);
                        }
                      }}
                      title="Click to add this tag"
                    >
                      {tag}
                      <Plus className="ml-1 h-3 w-3" />
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Media container */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
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

