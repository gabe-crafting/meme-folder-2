import React from 'react';
import { Star, X, Folder } from 'lucide-react';
import type { Favorite } from '../hooks/useFavorites';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

type Props = {
  favorites: Favorite[];
  onNavigate: (path: string) => void;
  onRemove: (path: string) => void;
  currentPath: string;
};

export function Sidebar({ favorites, onNavigate, onRemove, currentPath }: Props) {
  return (
    <ShadcnSidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2">
          <Star className="h-4 w-4" />
          <span className="font-semibold">Favorites</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Folders</SidebarGroupLabel>
          <SidebarGroupContent>
            {favorites.length === 0 ? (
              <div className="px-4 py-8 text-xs text-muted-foreground text-center">
                No favorites yet.<br />
                Right-click a folder to add.
              </div>
            ) : (
              <SidebarMenu>
                {favorites.map((favorite) => {
                  const isActive = favorite.path === currentPath;
                  return (
                    <SidebarMenuItem key={favorite.path}>
                      <div className="group flex items-center w-full">
                        <SidebarMenuButton
                          onClick={() => onNavigate(favorite.path)}
                          isActive={isActive}
                          className="flex-1"
                          tooltip={favorite.path}
                        >
                          <Folder className="h-4 w-4" />
                          <span className="truncate">{favorite.name}</span>
                        </SidebarMenuButton>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity mr-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove(favorite.path);
                          }}
                          title="Remove from favorites"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </ShadcnSidebar>
  );
}

