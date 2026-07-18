import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface AccessibleDialogProps {
  children: ReactNode;
  className?: string;
  label: string;
  onClose: () => void;
  labelledBy?: string;
  describedBy?: string;
  alert?: boolean;
}

const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const AccessibleDialog = ({ children, className = '', label, onClose, labelledBy, describedBy, alert = false }: AccessibleDialogProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const timer = window.setTimeout(() => (dialogRef.current?.querySelector<HTMLElement>(focusableSelector) ?? dialogRef.current)?.focus(), 0);
    return () => { window.clearTimeout(timer); openerRef.current?.focus(); };
  }, []);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
    if (!focusable.length) { event.preventDefault(); dialogRef.current?.focus(); return; }
    const first = focusable[0]; const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-3 sm:p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={dialogRef} tabIndex={-1} role={alert ? 'alertdialog' : 'dialog'} aria-modal="true" aria-label={labelledBy ? undefined : label} aria-labelledby={labelledBy} aria-describedby={describedBy} onKeyDown={onKeyDown} className={className}>
      {children}
    </div>
  </div>;
};
