import { useEffect, useRef, useState } from 'react';
import { DatabaseX, Download, Upload, X, HardDrive } from 'lucide-react';
import type { WorkspaceDocument } from '../../types';
import {
  clearAllLocalData,
  collectFullBrowserBackup,
  downloadProjectJson,
  getSnapshots,
  inspectFullBrowserBackup,
  loadIndex,
  importProjectFile,
  restoreFullBrowserBackup,
} from '../../lib/workspaceStore';
import { formatStorageUsage, getStorageUsage } from '../../lib/storageUsage';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface DataPortabilityModalProps {
  workspace: WorkspaceDocument;
  onClose: () => void;
  onReload: () => void;
}

export const DataPortabilityModal = ({ workspace, onClose, onReload }: DataPortabilityModalProps) => {
  const [storageUsage, setStorageUsage] = useState<string>('Calculating...');
  const [clearOpen, setClearOpen] = useState(false);
  const [clearText, setClearText] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const calculateStorage = async () => {
      try { setStorageUsage(`${formatStorageUsage(getStorageUsage().bytes)} used (WeaveStudio only)`); } catch {
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
      const allData = collectFullBrowserBackup();
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

    setImportFile(file);
  };
  const completeImport = () => {
    const file = importFile;
    if (!file) return;
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
    setImportFile(null);
  };

  const completeRestore = () => {
    const file = restoreFile;
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const inspected = inspectFullBrowserBackup(JSON.parse(String(event.target?.result ?? '')));
        if (!inspected.ok) { setMessage(inspected.error); return; }
        const restored = restoreFullBrowserBackup(inspected.data);
        if (!restored.ok) { setMessage(restored.error); return; }
        setMessage(`Restored ${inspected.data.workspaceCount} workspace(s) and ${inspected.data.snapshotCount} snapshot(s).`);
        setRestoreFile(null); onReload();
      } catch { setMessage('Failed to parse backup. No browser data was changed.'); }
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    clearAllLocalData();
    setMessage('All WeaveStudio browser data was cleared.');
    onReload();
    setClearOpen(false);
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

            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full bg-panel hover:bg-gray-800 text-gray-200 border border-border p-3 rounded-lg text-sm font-semibold transition-colors flex items-center gap-3">
              <Upload className="w-4 h-4 text-cyan-400" />
              <div className="text-left"><div className="text-cyan-300">Restore full browser backup</div><div className="text-xs text-gray-500 font-normal">Validates first, then replaces WeaveStudio records only</div></div>
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
              onClick={() => projectFileInputRef.current?.click()}
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
                ref={projectFileInputRef}
                className="hidden"
                onChange={handleImport}
              />
            </button>
            <input type="file" accept="application/json,.json" className="hidden" ref={fileInputRef} onChange={(event) => { const file = event.target.files?.[0]; if (file) setRestoreFile(file); }} />

            <button
              type="button"
              onClick={() => setClearOpen(true)}
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
        {clearOpen && <div className="absolute inset-0 z-10 flex items-center bg-black/75 p-5">
          <div className="w-full rounded-xl border border-red-500/40 bg-[#18181b] p-5" role="alertdialog" aria-modal="true" aria-labelledby="clear-title">
            <h3 id="clear-title" className="font-bold text-white">Clear all local data?</h3>
            <p className="mt-2 text-sm text-gray-300">This permanently removes {loadIndex().workspaces.length} workspace(s), {getSnapshots().length} snapshot(s), and about {formatStorageUsage(getStorageUsage().bytes)} of WeaveStudio data. This cannot be undone.</p>
            <p className="mt-2 text-xs text-amber-200">Download a backup first. Type <strong>CLEAR</strong> to enable deletion.</p>
            <input autoFocus value={clearText} onChange={(e) => setClearText(e.target.value)} aria-label="Type CLEAR to confirm" className="mt-3 w-full rounded border border-gray-700 bg-[#1e1e24] px-3 py-2 text-white" />
            <div className="mt-4 flex gap-2"><button type="button" onClick={handleDownloadAll} className="rounded border border-border px-3 py-2 text-sm text-blue-300">Download backup first</button><button type="button" onClick={() => { setClearOpen(false); setClearText(''); }} className="rounded border border-border px-3 py-2 text-sm text-gray-200">Cancel</button><button type="button" disabled={clearText !== 'CLEAR'} onClick={handleClear} className="rounded bg-red-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Permanently clear data</button></div>
          </div>
        </div>}
        <ConfirmDialog open={Boolean(importFile)} title="Import project as a new workspace?" description="The current workspace will remain unchanged. Full browser backups must use the dedicated restore flow." confirmLabel="Import new workspace" onCancel={() => { setImportFile(null); if (projectFileInputRef.current) projectFileInputRef.current.value = ''; }} onConfirm={completeImport} />
        <ConfirmDialog open={Boolean(restoreFile)} title="Restore full browser backup?" description="The file will be validated before any change. A restore replaces only WeaveStudio-owned browser records; unrelated site data stays untouched." confirmLabel="Restore validated backup" destructive onCancel={() => { setRestoreFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} onConfirm={completeRestore} />
      </div>
    </div>
  );
};
