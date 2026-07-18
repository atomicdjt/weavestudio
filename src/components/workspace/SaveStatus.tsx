import type { SaveStatus as SaveStatusType } from '../../types';
import { AlertTriangle, Check, CloudOff, Loader2 } from 'lucide-react';

interface SaveStatusProps {
  status: SaveStatusType;
  error?: string | null;
  workspaceName?: string;
}

export const SaveStatusChip = ({ status, error, workspaceName }: SaveStatusProps) => {
  const label =
    status === 'saving'
      ? 'Saving…'
      : status === 'saved'
        ? 'Saved locally'
        : status === 'quota'
          ? 'Storage full'
          : status === 'error'
            ? 'Save failed'
            : 'Ready';

  const className =
    status === 'saved'
      ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
      : status === 'saving'
        ? 'text-blue-300 border-blue-500/30 bg-blue-500/10'
        : status === 'quota' || status === 'error'
          ? 'text-amber-300 border-amber-500/40 bg-amber-500/10'
          : 'text-gray-400 border-gray-700 bg-gray-900/60';

  const Icon =
    status === 'saving' ? Loader2 : status === 'saved' ? Check : status === 'quota' || status === 'error' ? AlertTriangle : CloudOff;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium ${className}`}
      role="status"
      aria-live="polite"
      title={error || workspaceName || label}
    >
      <Icon className={`w-3.5 h-3.5 ${status === 'saving' ? 'animate-spin' : ''}`} />
      <span>{label}</span>
      {workspaceName && status === 'saved' && (
        <span className="hidden sm:inline text-gray-500 truncate max-w-[10rem]">· {workspaceName}</span>
      )}
    </div>
  );
};
