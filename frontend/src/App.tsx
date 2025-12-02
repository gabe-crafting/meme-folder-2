import React, { useState, useEffect } from 'react';
import { useFolderBrowser } from './hooks/useFolderBrowser';
import { useFavorites } from './hooks/useFavorites';
import { PathBar } from './components/PathBar';
import { FileList } from './components/FileList';
import { ImageViewer } from './components/ImageViewer';
import { Sidebar } from './components/Sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import type { FileEntry } from './hooks/useFolderBrowser';
import { GetAllTags } from '../wailsjs/go/main/App';

function App() {
    const {
        folderPath,
        setFolderPath,
        items,
        loading,
        error,
        readFolder,
        openParent,
        enterFolder,
        getParentPath,
    } = useFolderBrowser('C:\\Users\\gabe\\Desktop');

    const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();
    const [selectedImage, setSelectedImage] = useState<FileEntry | null>(null);
    const [allTags, setAllTags] = useState<Record<string, string[]>>({});
    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
    const [tagsRefreshKey, setTagsRefreshKey] = useState(0);

    const folders = items.filter((item) => item.type === 'folder');
    const allImages = items.filter((item) => item.type === 'image');

    // Load all tags when folder changes or when tags are updated
    useEffect(() => {
        const loadAllTags = async () => {
            try {
                const tags = await GetAllTags(folderPath);
                setAllTags(tags);
            } catch (err) {
                console.error('Failed to load tags:', err);
                setAllTags({});
            }
        };

        void loadAllTags();
        setSelectedTags(new Set()); // Clear selected tags when folder changes
    }, [folderPath, items, tagsRefreshKey]); // Reload when items change or refresh triggered

    const handleTagsChanged = () => {
        // Trigger a refresh of all tags
        setTagsRefreshKey(prev => prev + 1);
    };

    // Get unique tags from all images
    const uniqueTags = React.useMemo(() => {
        const tagSet = new Set<string>();
        Object.values(allTags).forEach(imageTags => {
            imageTags.forEach(tag => tagSet.add(tag));
        });
        return Array.from(tagSet).sort();
    }, [allTags]);

    // Filter images based on selected tags
    const filteredImages = React.useMemo(() => {
        if (selectedTags.size === 0) {
            return allImages;
        }

        return allImages.filter(image => {
            const imageTags = allTags[image.name] || [];
            // Image must have ALL selected tags
            return Array.from(selectedTags).every(tag => imageTags.includes(tag));
        });
    }, [allImages, allTags, selectedTags]);

    const toggleTag = (tag: string) => {
        const newSelectedTags = new Set(selectedTags);
        if (newSelectedTags.has(tag)) {
            newSelectedTags.delete(tag);
        } else {
            newSelectedTags.add(tag);
        }
        setSelectedTags(newSelectedTags);
    };

    // If an image is selected, show the image viewer
    if (selectedImage) {
        const currentImageIndex = filteredImages.findIndex(img => img.name === selectedImage.name);
        const imagePath = `${folderPath}\\${selectedImage.name}`;

        return (
            <ImageViewer
                imagePath={imagePath}
                imageName={selectedImage.name}
                folderPath={folderPath}
                onClose={() => setSelectedImage(null)}
                onNext={currentImageIndex < filteredImages.length - 1 
                    ? () => setSelectedImage(filteredImages[currentImageIndex + 1])
                    : undefined
                }
                onPrevious={currentImageIndex > 0
                    ? () => setSelectedImage(filteredImages[currentImageIndex - 1])
                    : undefined
                }
                hasNext={currentImageIndex < filteredImages.length - 1}
                hasPrevious={currentImageIndex > 0}
                onTagsChanged={handleTagsChanged}
            />
        );
    }

    return (
        <SidebarProvider>
            <div className="min-h-screen flex bg-background text-foreground">
                {/* Sidebar */}
                <Sidebar
                    favorites={favorites}
                    onNavigate={(path) => {
                        setFolderPath(path);
                        void readFolder(path);
                    }}
                    onRemove={removeFavorite}
                    currentPath={folderPath}
                />

                {/* Main content area */}
                <SidebarInset className="flex-1 flex flex-col min-h-0">
                    {/* Top bar / title */}
                    <header className="px-4 py-2 border-b border-border bg-card flex items-center gap-3">
                        <SidebarTrigger />
                        <h1 className="text-sm font-semibold">meme-folder-</h1>
                    </header>

                    {/* Path bar */}
                    <PathBar
                        folderPath={folderPath}
                        setFolderPath={setFolderPath}
                        loading={loading}
                        onOpen={() => { void readFolder(); }}
                        onBack={() => { void openParent(); }}
                        canGoBack={getParentPath(folderPath) !== folderPath}
                    />

                    {/* File lists: folders above, images below */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <FileList
                    title="Folders"
                    items={[
                        // Synthetic parent entry for "cd .."
                        {
                            name: '..',
                            type: 'folder',
                            size: 0,
                            modified: '',
                        },
                        ...folders,
                    ]}
                    loading={loading}
                    error={error}
                    collapsible={true}
                    defaultCollapsed={false}
                    folderPath={folderPath}
                    onAddFavorite={addFavorite}
                    isFavorite={isFavorite}
                    onItemClick={(entry) => {
                        if (entry.name === '..') {
                            void openParent();
                        } else {
                            void enterFolder(entry);
                        }
                    }}
                        />
                        <div className="border-t border-border" />
                        <FileList
                            title="Images"
                            items={filteredImages}
                            loading={loading}
                            error={null}
                            folderPath={folderPath}
                            uniqueTags={uniqueTags}
                            selectedTags={selectedTags}
                            onToggleTag={toggleTag}
                            totalItemCount={allImages.length}
                            onToggleFavorite={() => {
                                if (isFavorite(folderPath)) {
                                    void removeFavorite(folderPath);
                                } else {
                                    void addFavorite(folderPath);
                                }
                            }}
                            isCurrentFolderFavorite={isFavorite(folderPath)}
                            onItemClick={(entry) => {
                                setSelectedImage(entry);
                            }}
                        />
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}

export default App;
