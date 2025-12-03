import React, { useEffect, useState, useRef } from 'react';
import type { FileEntry } from '../hooks/useFolderBrowser';
import { ImagePreview } from './ImagePreview';
import { VideoPreview } from './VideoPreview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import Masonry from 'react-masonry-css';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { Copy, Trash2, Tag, FolderOpen, ExternalLink, Star } from 'lucide-react';
import { OpenInExplorer, CopyImageToClipboard } from '../../wailsjs/go/main/App';

type Props = {
  title: string;
  items: FileEntry[];
  loading: boolean;
  error: string | null;
  onItemClick: (entry: FileEntry) => void;
  folderPath?: string;
  // Tag filtering props (optional, only for Images section)
  uniqueTags?: string[];
  selectedTags?: Set<string>;
  onToggleTag?: (tag: string) => void;
  totalItemCount?: number;
  allTags?: Record<string, string[]>; // All tags for checking untagged items
  // Collapsible props
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  // Favorites props (optional, only for Folders section)
  onAddFavorite?: (path: string) => void;
  isFavorite?: (path: string) => boolean;
  // Current folder favorite toggle (for Images section)
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

export function FileList({
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
  allTags,
  collapsible = false,
  defaultCollapsed = false,
  onCollapsedChange,
  onAddFavorite,
  isFavorite,
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

  const renderItem = (item: FileEntry, index: number) => {
    const isImage = item.type === 'image';
    const isVideo = item.type === 'video';
    const isMedia = isImage || isVideo;
    const mediaPath = folderPath ? `${folderPath}\\${item.name}` : '';

    // Folders use simple icon + name layout
    if (item.type === 'folder') {
      const itemContent = (
        <div
          className="flex flex-col items-center justify-start cursor-pointer rounded transition-all w-[100px] py-0.5 px-0.5 min-h-[80px] text-foreground hover:bg-accent hover:text-accent-foreground"
          onClick={() => {
            onItemClick(item);
          }}
        >
          <div className="flex items-center justify-center mb-0.5 w-10 h-10 shrink-0">
            <span className="text-2xl leading-none">📁</span>
          </div>
          <span className="text-xs text-center break-words w-full line-clamp-2 leading-tight">
            {item.name}
          </span>
        </div>
      );

      return (
        <ContextMenu key={item.name}>
          <ContextMenuTrigger asChild>{itemContent}</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={() => onItemClick(item)}>
              <FolderOpen className="mr-2 h-4 w-4" />
              Open Folder
            </ContextMenuItem>
            {onAddFavorite && folderPath && (
              <>
                <ContextMenuSeparator />
                <ContextMenuItem 
                  onClick={() => {
                    const fullPath = `${folderPath}\\${item.name}`;
                    onAddFavorite(fullPath);
                  }}
                  disabled={isFavorite && folderPath ? isFavorite(`${folderPath}\\${item.name}`) : false}
                >
                  <Star className="mr-2 h-4 w-4" />
                  {isFavorite && folderPath && isFavorite(`${folderPath}\\${item.name}`) 
                    ? 'Already in Favorites' 
                    : 'Add to Favorites'}
                </ContextMenuItem>
              </>
            )}
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => handleCopyName(item)}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Name
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleCopyPath(item)}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Path
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    }

    // Media items (images/videos) use masonry with no names
    const itemContent = (
      <div
        className="cursor-pointer rounded transition-all overflow-hidden hover:ring-2 hover:ring-accent"
        onClick={() => {
          onItemClick(item);
        }}
        title={item.name}
      >
        {/* Media preview */}
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
        <ContextMenuTrigger asChild>
          {itemContent}
        </ContextMenuTrigger>
        <ContextMenuContent>
          {item.type === 'folder' ? (
            <>
              <ContextMenuItem onClick={() => onItemClick(item)}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Open Folder
              </ContextMenuItem>
              {onAddFavorite && folderPath && (
                <>
                  <ContextMenuSeparator />
                  <ContextMenuItem 
                    onClick={() => {
                      const fullPath = `${folderPath}\\${item.name}`;
                      onAddFavorite(fullPath);
                    }}
                    disabled={isFavorite && folderPath ? isFavorite(`${folderPath}\\${item.name}`) : false}
                  >
                    <Star className="mr-2 h-4 w-4" />
                    {isFavorite && folderPath && isFavorite(`${folderPath}\\${item.name}`) 
                      ? 'Already in Favorites' 
                      : 'Add to Favorites'}
                  </ContextMenuItem>
                </>
              )}
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => handleCopyName(item)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Name
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleCopyPath(item)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Path
              </ContextMenuItem>
            </>
          ) : (
            <>
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
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  // If collapsible, wrap in Accordion
  if (collapsible) {
    return (
      <Accordion 
        type="single" 
        collapsible 
        defaultValue={defaultCollapsed ? undefined : "item-1"} 
        className="bg-card/30"
        onValueChange={(value) => {
          if (onCollapsedChange) {
            onCollapsedChange(value === '');
          }
        }}
      >
        <AccordionItem value="item-1" className="border-b border-border">
          <AccordionTrigger className="px-4 py-2 hover:no-underline bg-card/80">
            <span className="text-xs font-medium text-muted-foreground">{title}</span>
          </AccordionTrigger>
          <AccordionContent className="pb-0">
            <div
              className="overflow-auto outline-none bg-background max-h-[300px]"
            >
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
              {/* Simple flex layout for folders */}
              <div className="p-1 w-full">
                <div className="flex flex-wrap gap-1 w-full">
                  {items.map((item, index) => renderItem(item, index))}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }

  // Non-collapsible version (for Images section)
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
        
        {/* Tag filter (only shown if tags are provided and showTags is true) */}
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
      {/* Scrollable grid area */}
      <div
        className="flex-1 overflow-auto outline-none bg-background"
      >
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
        {/* Masonry layout for media */}
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
            {items.map((item, index) => renderItem(item, index))}
          </Masonry>
        </div>
      </div>
    </section>
  );
}

