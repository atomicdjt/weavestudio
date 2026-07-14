import { useEffect, useRef } from 'react';

export const ConfirmDialog = ({ open, title, description, confirmLabel, destructive = false, onConfirm, onCancel }: { open: boolean; title: string; description: string; confirmLabel: string; destructive?: boolean; onConfirm: () => void; onCancel: () => void }) => {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (open) cancelRef.current?.focus(); }, [open]);
  if (!open) return null;
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description" onKeyDown={(e) => { if (e.key === 'Escape') onCancel(); }}><div className="w-full max-w-md rounded-xl border border-border bg-panel p-5 shadow-2xl"><h2 id="confirm-title" className="text-lg font-bold text-white">{title}</h2><p id="confirm-description" className="mt-2 text-sm text-gray-400">{description}</p><div className="mt-5 flex justify-end gap-2"><button ref={cancelRef} type="button" onClick={onCancel} className="rounded border border-border px-3 py-2 text-sm text-gray-200">Cancel</button><button type="button" onClick={onConfirm} className={`rounded px-3 py-2 text-sm font-semibold text-white ${destructive ? 'bg-red-600' : 'bg-blue-600'}`}>{confirmLabel}</button></div></div></div>;
};
