import { useEffect, useState } from 'react';
import type { AppEdge, AppNode, VersionSnapshot } from '../../types';
import { getVersions, saveVersion, deleteVersion } from '../../lib/storage';
import { Save, Trash2, RotateCcw } from 'lucide-react';

interface VersionHistoryProps {
  nodes: AppNode[];
  edges: AppEdge[];
  clearSignal: number;
  onRestore: (nodes: AppNode[], edges: AppEdge[]) => void;
}

export const VersionHistory = ({ nodes, edges, clearSignal, onRestore }: VersionHistoryProps) => {
  const [versions, setVersions] = useState<VersionSnapshot[]>(getVersions());
  const [title, setTitle] = useState('');

  useEffect(() => {
    setVersions(getVersions());
  }, [clearSignal]);

  const handleSave = () => {
    if (!title.trim()) return;
    const v = saveVersion(title, nodes, edges);
    setVersions([...versions, v]);
    setTitle('');
  };

  const handleDelete = (id: string) => {
    deleteVersion(id);
    setVersions(versions.filter(v => v.id !== id));
  };

  return (
    <aside className="w-full lg:w-64 bg-panel border-t lg:border-t-0 lg:border-l border-border p-4 flex flex-col lg:h-full max-h-96 lg:max-h-none overflow-y-auto">
      <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500 mb-4">Version Snapshots</h3>
      <p className="text-xs text-gray-400 mb-4">Save named checkpoints in browser localStorage for local restore points.</p>

      <div className="mb-6 space-y-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Snapshot name..."
          className="w-full bg-[#1e1e24] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          aria-label="Snapshot name"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={!title.trim()}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Snapshot</span>
        </button>
      </div>

      <div className="space-y-3">
        {versions.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-700 bg-[#1e1e24] px-4 py-6 text-center">
            <div className="text-sm font-semibold text-gray-300 mb-1">No snapshots yet</div>
            <p className="text-xs text-gray-500">
              Name the current workflow and save a checkpoint before major edits.
            </p>
          </div>
        )}
        {versions.map((v) => (
          <div key={v.id} className="bg-[#1e1e24] border border-gray-800 rounded-lg p-3">
            <h4 className="font-semibold text-sm text-gray-200 truncate">{v.title}</h4>
            <div className="text-xs text-gray-500 mt-1">{new Date(v.timestamp).toLocaleString()}</div>
            <div className="flex items-center space-x-2 mt-3">
              <button
                type="button"
                onClick={() => onRestore(v.nodes, v.edges)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium py-1.5 rounded transition-colors flex items-center justify-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restore</span>
              </button>
              <button
                type="button"
                onClick={() => handleDelete(v.id)}
                className="p-1.5 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded transition-colors"
                title="Delete Snapshot"
                aria-label={`Delete snapshot ${v.title}`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
