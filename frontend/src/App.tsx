import React from 'react';
import { useFolderBrowser } from './hooks/useFolderBrowser';
import { PathBar } from './components/PathBar';
import { FileList } from './components/FileList';

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

    const folders = items.filter((item) => item.type === 'folder');
    const images = items.filter((item) => item.type === 'image');

    return (
        <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
            {/* Top bar / title */}
            <header className="px-4 py-2 border-b border-slate-800">
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
                    onItemClick={(entry) => {
                        if (entry.name === '..') {
                            void openParent();
                        } else {
                            void enterFolder(entry);
                        }
                    }}
                />
                <div className="border-t border-slate-800" />
                <FileList
                    title="Images"
                    items={images}
                    loading={loading}
                    error={null}
                    folderPath={folderPath}
                    onItemClick={() => {
                        // no-op for now; navigation only for folders
                    }}
                />
            </div>
        </div>
    );
}

export default App;
