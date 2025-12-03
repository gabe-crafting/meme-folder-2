import React from 'react';
import { Badge } from '@/components/ui/badge';

type Props = {
  allFolderTags: string[];
  tags: string[];
  newTag: string;
  hideInactiveTags: boolean;
  onToggleTag: (tag: string) => void;
};

export function TagList({
  allFolderTags,
  tags,
  newTag,
  hideInactiveTags,
  onToggleTag,
}: Props) {
  return (
    <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-[20vh] pr-2 pb-2 scrollbar-minimal">
      {allFolderTags
        .map(tag => {
          const isActive = tags.includes(tag);
          return { tag, isActive };
        })
        // Sort: active tags first
        .sort((a, b) => {
          if (a.isActive && !b.isActive) return -1;
          if (!a.isActive && b.isActive) return 1;
          return 0;
        })
        // Filter: active tags are never filtered, inactive tags can be filtered by input
        .filter(({ tag, isActive }) => {
          // Hide inactive tags if switch is on
          if (!isActive && hideInactiveTags) return false;
          // Active tags are always shown (not filtered by input)
          if (isActive) return true;
          // Inactive tags are filtered by input
          return newTag === '' || tag.toLowerCase().includes(newTag.toLowerCase());
        })
        .map(({ tag, isActive }) => (
          <Badge
            key={tag}
            variant={isActive ? "default" : "outline"}
            className={`cursor-pointer transition-colors ${
              isActive 
                ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
                : "hover:bg-muted"
            }`}
            onClick={() => onToggleTag(tag)}
            title={isActive ? "Click to remove" : "Click to add"}
          >
            {tag}
          </Badge>
        ))}
    </div>
  );
}

