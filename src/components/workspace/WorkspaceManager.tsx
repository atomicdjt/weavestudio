import { Copy, FolderPlus, Trash2 } from 'lucide-react';
import type { WorkspaceIndexEntry } from '../../types';

interface WorkspaceManagerProps {
  workspaces: WorkspaceIndexEntry[];
  activeId: string | null;
  workspaceName: string;
  onSelect: (id: string) => void;
  onRename: (name: string) => void;
  onCreate: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export const WorkspaceManager = ({
  workspaces,
  activeId,
  workspaceName,
  onSelect,
  onRename,
  onCreate,
  onDuplicate,
  onDelete,
}: WorkspaceManagerProps) => {
  return (
    <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
      <label className="sr-only" htmlFor="workspace-select">
        Active workspace
      </label>
      <select
        id="workspace-select"
        value={activeId ?? ''}
        onChange={(e) => e.target.value && onSelect(e.target.value)}
        className="bg-panel border border-border text-sm text-gray-200 rounded-lg px-2 py-2 max-w-[11rem] sm:max-w-[14rem]"
      >
        {workspaces.length === 0 && <option value="">No workspaces</option>}
        {workspaces.map((ws) => (
          <option key={ws.id} value={ws.id}>
            {ws.name}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={workspaceName}
        onChange={(e) => onRename(e.target.value)}
        className="bg-panel border border-border text-sm text-white rounded-lg px-2 py-2 w-36 sm:w-48"
        aria-label="Workspace name"
        placeholder="Workspace name"
      />
      <button
        type="button"
        onClick={onCreate}
        className="bg-panel border border-border text-gray-300 hover:text-white p-2 rounded-lg"
        title="New workspace"
        aria-label="Create new workspace"
      >
        <FolderPlus className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onDuplicate}
        className="bg-panel border border-border text-gray-300 hover:text-white p-2 rounded-lg"
        title="Duplicate workspace"
        aria-label="Duplicate workspace"
      >
        <Copy className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="bg-panel border border-border text-red-400 hover:text-red-300 p-2 rounded-lg"
        title="Delete workspace"
        aria-label="Delete workspace"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};
