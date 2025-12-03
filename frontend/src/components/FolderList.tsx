import React from 'react';
import type { FileEntry } from '../hooks/useFolderBrowser';
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
import { Copy, FolderOpen, Star } from 'lucide-react';

type Props = {
  title: string;
  items: FileEntry[];
  loading: boolean;
  error: string | null;
  onItemClick: (entry: FileEntry) => void;
  folderPath?: string;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onAddFavorite?: (path: string) => void;
  isFavorite?: (path: string) => boolean;
};

export function FolderList({
  title,
  items,
  loading,
  error,
  onItemClick,
  folderPath,
  defaultCollapsed = false,
  onCollapsedChange,
  onAddFavorite,
  isFavorite,
}: Props) {
  const handleCopyPath = (item: FileEntry) => {
    if (folderPath) {
      const fullPath = `${folderPath}\\${item.name}`;
      navigator.clipboard.writeText(fullPath);
    }
  };

  const handleCopyName = (item: FileEntry) => {
    navigator.clipboard.writeText(item.name);
  };

  const renderFolder = (item: FileEntry) => {
    const itemContent = (
      <div
        className="flex flex-col items-center justify-start cursor-pointer rounded transition-all w-[100px] py-0.5 px-0.5 min-h-[80px] text-foreground hover:bg-accent hover:text-accent-foreground"
        onClick={() => onItemClick(item)}
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
  };

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
          <div className="overflow-auto outline-none bg-background max-h-[300px]">
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
              <div className="flex flex-wrap gap-1 w-full">
                {items.map((item) => renderFolder(item))}
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

