import React from 'react';

type Props = {
  folderPath: string;
  setFolderPath: (path: string) => void;
  loading: boolean;
  onOpen: () => void;
  onBack: () => void;
  canGoBack: boolean;
};

export function PathBar({
  folderPath,
  setFolderPath,
  loading,
  onOpen,
  onBack,
  canGoBack,
}: Props) {
  return (
    <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
      <input
        type="text"
        value={folderPath}
        onChange={(e) => setFolderPath(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onOpen();
          }
        }}
        className="flex-1 rounded-md border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        placeholder="C:\Users\gabe\Desktop\notes"
      />
      <button
        type="button"
        onClick={onOpen}
        className="shrink-0 inline-flex items-center rounded-md bg-indigo-500 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-400 disabled:opacity-40"
        disabled={loading}
      >
        {loading ? 'Reading…' : 'Open'}
      </button>
      <button
        type="button"
        onClick={onBack}
        className="shrink-0 inline-flex items-center rounded-md border border-slate-700 bg-slate-800 px-2 py-2 text-xs font-medium text-slate-100 hover:bg-slate-700 disabled:opacity-40"
        disabled={loading || !canGoBack}
        title="Go up one level"
      >
        ←
      </button>
    </div>
  );
}


