import React, { useEffect, useState, useRef } from 'react';
import { DatabaseX, Download, Upload, X, HardDrive } from 'lucide-react';
import { clearAllLocalData } from '../../lib/storage';

interface DataPortabilityModalProps {
  onClose: () => void;
  onClearSignal: () => void;
}

export const DataPortabilityModal = ({ onClose, onClearSignal }: DataPortabilityModalProps) => {
  const [storageUsage, setStorageUsage] = useState<string>('Calculating...');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const calculateStorage = async () => {
      try {
        if (navigator.storage && navigator.storage.estimate) {
          const estimate = await navigator.storage.estimate();
          if (estimate.usage !== undefined) {
            const kb = (estimate.usage / 1024).toFixed(1);
            setStorageUsage(`${kb} KB used`);
            return;
          }
        }
        // Fallback calculation
        let total = 0;
        for (const key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            total += ((localStorage[key].length + key.length) * 2);
          }
        }
        setStorageUsage(`${(total / 1024).toFixed(1)} KB used`);
      } catch (e) {
        setStorageUsage('Unknown');
      }
    };
    calculateStorage();
  }, []);

  const handleDownloadAll = () => {
    try {
      const allData: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
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
    } catch (err) {
      alert('Failed to generate export file.');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('This will OVERWRITE your current local data with the imported file. Proceed?')) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        
        // Basic validation
        if (typeof parsed !== 'object' || parsed === null) throw new Error('Invalid format');
        
        let importedCount = 0;
        for (const [key, value] of Object.entries(parsed)) {
          if (key.startsWith('weavestudio_') && typeof value === 'string') {
            localStorage.setItem(key, value);
            importedCount++;
          }
        }
        
        alert(`Successfully imported ${importedCount} items. The workspace will now reload.`);
        onClearSignal();
        window.location.reload();
      } catch (err) {
        alert('Failed to parse import file. Ensure it is a valid WeaveStudio backup JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    if (!confirm('Clear the current workspace and all saved snapshots from this browser? This cannot be undone.')) return;
    clearAllLocalData();
    onClearSignal();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-panel border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-[#18181b]">
          <h2 className="font-bold text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-emerald-400" />
            Data Portability
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-sm text-gray-300">
            <p className="mb-2">Your data never leaves your device unless you export it. You can download a backup of all local snapshots and workspaces here.</p>
            <div className="flex items-center gap-2 mt-4 bg-[#1e1e24] border border-gray-800 p-3 rounded-lg text-xs font-mono">
              <span className="text-gray-500 uppercase font-bold tracking-wider">Local Storage Usage:</span>
              <span className="text-emerald-400">{storageUsage}</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleDownloadAll}
              className="w-full bg-panel hover:bg-gray-800 text-gray-200 border border-border p-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Download className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300" />
                <div className="text-left">
                  <div className="text-emerald-500 group-hover:text-emerald-400">Download All Data</div>
                  <div className="text-xs text-gray-500 font-normal">Export complete JSON backup</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-panel hover:bg-gray-800 text-gray-200 border border-border p-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Upload className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
                <div className="text-left">
                  <div className="text-blue-500 group-hover:text-blue-400">Import Data</div>
                  <div className="text-xs text-gray-500 font-normal">Restore from a JSON backup file</div>
                </div>
              </div>
              <input 
                type="file" 
                accept="application/json" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleImport} 
              />
            </button>

            <button
              onClick={handleClear}
              className="w-full bg-panel hover:bg-red-900/20 text-gray-200 border border-border p-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <DatabaseX className="w-4 h-4 text-red-400 group-hover:text-red-300" />
                <div className="text-left">
                  <div className="text-red-500 group-hover:text-red-400">Clear Local Data</div>
                  <div className="text-xs text-gray-500 font-normal">Wipe browser storage completely</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
