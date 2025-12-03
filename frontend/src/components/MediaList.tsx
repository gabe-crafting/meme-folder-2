import React, { useState } from 'react';
import type { FileEntry } from '../hooks/useFolderBrowser';
import { ImagePreview } from './ImagePreview';
import { VideoPreview } from './VideoPreview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import Masonry from 'react-masonry-css';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { Copy, Tag, ExternalLink, Star } from 'lucide-react';
import { OpenInExplorer, CopyImageToClipboard } from '../../wailsjs/go/main/App';

type Props = {
  title: string;
  items: FileEntry[];
  loading: boolean;
  error: string | null;
  onItemClick: (entry: FileEntry) => void;
  folderPath?: string;
  // Tag filtering
  uniqueTags?: string[];
  selectedTags?: Set<string>;
  onToggleTag?: (tag: string) => void;
  totalItemCount?: number;
  // Favorites
  onToggleFavorite?: () => void;
  isCurrentFolderFavorite?: boolean;
  // Untagged filter
  showOnlyUntagged?: boolean;
  onToggleUntagged?: (value: boolean) => void;
  // Show tags
  showTags?: boolean;
  onShowTagsChange?: (value: boolean) => void;
  // Tag filter mode (intersection vs union)
  tagFilterIntersect?: boolean;
  onTagFilterIntersectChange?: (value: boolean) => void;
};

export function MediaList({
  title,
  items,
  loading,
  error,
  onItemClick,
  folderPath,
  uniqueTags,
  selectedTags,
  onToggleTag,
  totalItemCount,
  onToggleFavorite,
  isCurrentFolderFavorite,
  showOnlyUntagged,
  onToggleUntagged,
  showTags = true,
  onShowTagsChange,
  tagFilterIntersect = true,
  onTagFilterIntersectChange,
}: Props) {
  const [tagSearchQuery, setTagSearchQuery] = useState('');

  const handleCopyPath = (item: FileEntry) => {
    if (folderPath) {
      const fullPath = `${folderPath}\\${item.name}`;
      navigator.clipboard.writeText(fullPath);
    }
  };

  const handleCopyName = (item: FileEntry) => {
    navigator.clipboard.writeText(item.name);
  };

  const handleOpenInExplorer = async (item: FileEntry) => {
    if (folderPath) {
      const fullPath = `${folderPath}\\${item.name}`;
      try {
        await OpenInExplorer(fullPath);
      } catch (err) {
        console.error('Failed to open in explorer:', err);
      }
    }
  };

  const handleCopyImage = async (item: FileEntry) => {
    if (!folderPath) return;

    const fullPath = `${folderPath}\\${item.name}`;

    try {
      await CopyImageToClipboard(fullPath);
    } catch (err) {
      console.error('Failed to copy image:', err);
    }
  };

  const renderMediaItem = (item: FileEntry) => {
    const isImage = item.type === 'image';
    const isVideo = item.type === 'video';
    const mediaPath = folderPath ? `${folderPath}\\${item.name}` : '';

    const itemContent = (
      <div
        className="cursor-pointer rounded transition-all overflow-hidden hover:ring-2 hover:ring-accent"
        onClick={() => onItemClick(item)}
        title={item.name}
      >
        {isImage && mediaPath ? (
          <ImagePreview
            imagePath={mediaPath}
            imageName={item.name}
            className="w-full h-auto max-w-full rounded-sm border border-border"
          />
        ) : isVideo && mediaPath ? (
          <VideoPreview
            videoPath={mediaPath}
            videoName={item.name}
            className="w-full h-auto max-w-full rounded-sm border border-border"
          />
        ) : null}
      </div>
    );

    return (
      <ContextMenu key={item.name}>
        <ContextMenuTrigger asChild>{itemContent}</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => onItemClick(item)}>
            <Tag className="mr-2 h-4 w-4" />
            {item.type === 'video' ? 'Open & Tag Video' : 'Open & Tag'}
          </ContextMenuItem>
          <ContextMenuItem onClick={() => void handleOpenInExplorer(item)}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Open in File Explorer
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => handleCopyName(item)}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Name
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleCopyPath(item)}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Full Path
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => void handleCopyImage(item)}>
            <Copy className="mr-2 h-4 w-4" />
            {item.type === 'video' ? 'Copy Video File' : 'Copy Image'}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  return (
    <section className="flex-1 flex flex-col min-h-0 bg-card/30">
      {/* Header bar */}
      <div className="px-4 py-2 border-b border-border bg-card/80">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            {onToggleFavorite && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0"
                onClick={onToggleFavorite}
                title={isCurrentFolderFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Star className={`h-4 w-4 ${isCurrentFolderFavorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
              </Button>
            )}
            <span className="text-xs font-medium text-muted-foreground">{title}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Tag search input */}
            {uniqueTags && uniqueTags.length > 0 && showTags && (
              <Input
                type="text"
                placeholder="Search tags..."
                value={tagSearchQuery}
                onChange={(e) => setTagSearchQuery(e.target.value)}
                className="h-7 w-32 text-xs"
              />
            )}

            {/* Tag filter mode switch (Union vs Intersection) */}
            {showTags && uniqueTags && uniqueTags.length > 0 && selectedTags && selectedTags.size > 0 && onTagFilterIntersectChange && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={!tagFilterIntersect}
                  onCheckedChange={(value) => onTagFilterIntersectChange(!value)}
                  className="scale-75"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">Union</span>
              </div>
            )}

            {/* Hide tags switch */}
            {uniqueTags && uniqueTags.length > 0 && onShowTagsChange && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={showTags}
                  onCheckedChange={onShowTagsChange}
                  className="scale-75"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">Show tags</span>
              </div>
            )}

            {/* Untagged filter switch */}
            {onToggleUntagged && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={showOnlyUntagged || false}
                  onCheckedChange={onToggleUntagged}
                  className="scale-75"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">Untagged only</span>
              </div>
            )}

            {selectedTags && selectedTags.size > 0 && totalItemCount && (
              <span className="text-xs text-muted-foreground">
                ({items.length} of {totalItemCount})
              </span>
            )}
          </div>
        </div>

        {/* Tag filter */}
        {showTags && uniqueTags && uniqueTags.length > 0 && onToggleTag && selectedTags && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {uniqueTags
              .filter(tag =>
                tagSearchQuery === '' ||
                tag.toLowerCase().includes(tagSearchQuery.toLowerCase())
              )
              .map((tag) => {
                const isSelected = selectedTags.has(tag);
                return (
                  <Badge
                    key={tag}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer transition-all text-xs"
                    onClick={() => onToggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                );
              })}
          </div>
        )}
      </div>

      {/* Scrollable masonry grid */}
      <div className="flex-1 overflow-auto outline-none bg-background">
        {error && (
          <div className="mb-2 text-xs text-destructive px-4 py-2">
            {error}
          </div>
        )}
        {items.length === 0 && !loading && !error && (
          <div className="px-4 py-8 text-xs text-muted-foreground text-center">
            (Empty)
          </div>
        )}
        <div className="p-1 w-full">
          <Masonry
            breakpointCols={{
              default: 6,
              1536: 5,
              1280: 4,
              1024: 3,
              768: 2,
              640: 1
            }}
            className="flex gap-2 w-full"
            columnClassName="flex flex-col gap-2"
          >
            {items.map((item) => renderMediaItem(item))}
          </Masonry>
        </div>
      </div>
    </section>
  );
}

