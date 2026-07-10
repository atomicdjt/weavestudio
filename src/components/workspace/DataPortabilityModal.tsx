import { useEffect, useRef, useState } from 'react';
import { DatabaseX, Download, Upload, X, HardDrive } from 'lucide-react';
import type { WorkspaceDocument } from '../../types';
import {
  clearAllLocalData,
  downloadProjectJson,
  importProjectFile,
} from '../../lib/workspaceStore';

interface DataPortabilityModalProps {
  workspace: WorkspaceDocument;
  onClose: () => void;
  onReload: () => void;
}

export const DataPortabilityModal = ({ workspace, onClose, onReload }: DataPortabilityModalProps) => {
  const [storageUsage, setStorageUsage] = useState<string>('Calculating...');
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const calculateStorage = async () => {
      try {
        if (navigator.storage?.estimate) {
          const estimate = await navigator.storage.estimate();
          if (estimate.usage !== undefined) {
            setStorageUsage(`${(estimate.usage / 1024).toFixed(1)} KB used`);
            return;
          }
        }
        let total = 0;
        for (const key in localStorage) {
          if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
            total += (localStorage[key].length + key.length) * 2;
          }
        }
        setStorageUsage(`${(total / 1024).toFixed(1)} KB used`);
      } catch {
        setStorageUsage('Unknown');
      }
    };
    calculateStorage();
  }, []);

  const handleDownloadProject = () => {
    try {
      downloadProjectJson(workspace);
      setMessage('Project JSON downloaded.');
    } catch {
      setMessage('Failed to generate project export.');
    }
  };

  const handleDownloadAll = () => {
    try {
      const allData: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key && key.startsWith('weavestudio_')) {
          allData[key] = localStorage.getItem(key) || '';
        }
      }
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `weavestudio_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage('Full local backup downloaded.');
    } catch {
      setMessage('Failed to generate backup file.');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('Import this file as a new workspace (recommended)? Click Cancel to abort.')) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content) as unknown;
        const result = importProjectFile(parsed, 'as-new');
        if (!result.ok) {
          setMessage(result.error);
          return;
        }
        setMessage(`Imported “${result.workspace.name}”. Reloading workspace…`);
        onReload();
        onClose();
      } catch {
        setMessage('Failed to parse import file. Use a WeaveStudio project JSON or full backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    if (!confirm('Clear ALL WeaveStudio data from this browser? Export a backup first. This cannot be undone.')) {
      return;
    }
    clearAllLocalData();
    onReload();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-panel border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Data portability"
      >
        <div className="flex items-center justify-between p-4 border-b border-border bg-[#18181b]">
          <h2 className="font-bold text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-emerald-400" />
            Data portability
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-sm text-gray-300">
            <p className="mb-2">
              Workspaces stay in this browser unless you export them. Golden-path work never requires a network call.
            </p>
            <div className="flex items-center gap-2 mt-4 bg-[#1e1e24] border border-gray-800 p-3 rounded-lg text-xs font-mono">
              <span className="text-gray-500 uppercase font-bold tracking-wider">Local storage:</span>
              <span className="text-emerald-400">{storageUsage}</span>
            </div>
            {message && <p className="mt-3 text-xs text-blue-300">{message}</p>}
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleDownloadProject}
              className="w-full bg-panel hover:bg-gray-800 text-gray-200 border border-border p-3 rounded-lg text-sm font-semibold transition-colors flex items-center gap-3"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <div className="text-left">
                <div className="text-emerald-400">Export current project</div>
                <div className="text-xs text-gray-500 font-normal">.weavestudio.json (round-trip)</div>
              </div>
            </button>

            <button
              type="button"
              onClick={handleDownloadAll}
              className="w-full bg-panel hover:bg-gray-800 text-gray-200 border border-border p-3 rounded-lg text-sm font-semibold transition-colors flex items-center gap-3"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <div className="text-left">
                <div className="text-blue-400">Download all local data</div>
                <div className="text-xs text-gray-500 font-normal">Full browser backup</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-panel hover:bg-gray-800 text-gray-200 border border-border p-3 rounded-lg text-sm font-semibold transition-colors flex items-center gap-3"
            >
              <Upload className="w-4 h-4 text-amber-400" />
              <div className="text-left">
                <div className="text-amber-400">Import project / backup</div>
                <div className="text-xs text-gray-500 font-normal">Creates a new workspace by default</div>
              </div>
              <input
                type="file"
                accept="application/json,.json,.weavestudio.json"
                ref={fileInputRef}
                className="hidden"
                onChange={handleImport}
              />
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="w-full bg-panel hover:bg-red-900/20 text-gray-200 border border-border p-3 rounded-lg text-sm font-semibold transition-colors flex items-center gap-3"
            >
              <DatabaseX className="w-4 h-4 text-red-400" />
              <div className="text-left">
                <div className="text-red-400">Clear all local data</div>
                <div className="text-xs text-gray-500 font-normal">Wipe this browser&apos;s WeaveStudio storage</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
