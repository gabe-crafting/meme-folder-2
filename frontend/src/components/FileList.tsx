import React, { useEffect, useState, useRef } from 'react';
import type { FileEntry } from '../hooks/useFolderBrowser';
import { ImagePreview } from './ImagePreview';

type Props = {
  title: string;
  items: FileEntry[];
  loading: boolean;
  error: string | null;
  onItemClick: (entry: FileEntry) => void;
  folderPath?: string;
};

export function FileList({
  title,
  items,
  loading,
  error,
  onItemClick,
  folderPath,
}: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);

  // Reset selection when items change
  useEffect(() => {
    if (items.length > 0) {
      setSelectedIndex(0);
    } else {
      setSelectedIndex(null);
    }
  }, [items]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [selectedIndex]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (!items.length) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => {
        if (prev === null) return 0;
        return Math.min(prev + 1, items.length - 1);
      });
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => {
        if (prev === null) return 0;
        return Math.max(prev - 1, 0);
      });
    } else if (e.key === 'Home') {
      e.preventDefault();
      setSelectedIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setSelectedIndex(items.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex !== null) {
        onItemClick(items[selectedIndex]);
      }
    }
  };

  return (
    <section className="flex-1 flex flex-col min-h-0 bg-card/30">
      {/* Header bar */}
      <div className="px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border bg-card/80">
        {title}
      </div>
      {/* Scrollable grid area */}
      <div
        className="flex-1 overflow-auto outline-none bg-background"
        tabIndex={0}
        onKeyDown={handleKeyDown}
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
        {/* Flex layout similar to Windows 10 File Explorer medium icons */}
        <div className="p-1">
          <div className="flex flex-wrap gap-1 justify-start">
            {items.map((item, index) => {
              const isSelected = index === selectedIndex;
              const isImage = item.type === 'image';
              const imagePath = folderPath ? `${folderPath}\\${item.name}` : '';

              return (
                <div
                  key={item.name}
                  ref={isSelected ? selectedItemRef : null}
                  className={`flex flex-col items-center justify-start cursor-pointer rounded transition-all w-[100px] py-0.5 px-0.5 min-h-[80px] ${
                    isSelected
                      ? 'bg-primary/90 text-primary-foreground shadow-md'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                  onClick={() => {
                    setSelectedIndex(index);
                    onItemClick(item);
                  }}
                >
                  {/* Icon / Image preview */}
                  <div
                    className={`flex items-center justify-center mb-0.5 shrink-0 ${
                      isImage ? 'w-[72px] h-[72px]' : 'w-10 h-10'
                    }`}
                  >
                    {isImage && imagePath ? (
                      <ImagePreview
                        imagePath={imagePath}
                        imageName={item.name}
                        className="w-full h-full rounded-sm border border-border"
                      />
                    ) : (
                      <span className="text-2xl leading-none">
                        {item.type === 'folder' ? '📁' : '🖼️'}
                      </span>
                    )}
                  </div>
                  {/* Name */}
                  <span className="text-xs text-center break-words w-full line-clamp-2 leading-tight">
                    {item.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

