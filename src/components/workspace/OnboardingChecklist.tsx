import { useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';

export const OnboardingChecklist = ({ hasSource, hasNodes, validated, onOpenTemplates }: { hasSource: boolean; hasNodes: boolean; validated: boolean; onOpenTemplates: () => void }) => {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('weavestudio_onboarding_dismissed') === '1');
  if (dismissed) return null;
  const steps = [{ label: 'Choose a template or open the guided demo', done: hasNodes, action: onOpenTemplates }, { label: 'Paste source material', done: hasSource }, { label: 'Validate, generate, and export', done: validated }];
  return <aside className="pointer-events-auto max-w-xl rounded-lg border border-blue-500/30 bg-blue-950/90 p-3 text-xs text-blue-50 shadow-lg" aria-label="Getting started checklist"><div className="flex justify-between gap-3"><div><strong>First successful deliverable</strong><ol className="mt-2 space-y-1">{steps.map((step) => <li key={step.label} className="flex gap-2">{step.done ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <span className="h-4 w-4 rounded-full border border-blue-300" />}<span>{step.action && !step.done ? <button className="underline" onClick={step.action}>{step.label}</button> : step.label}</span></li>)}</ol></div><button type="button" aria-label="Dismiss getting started checklist" onClick={() => { localStorage.setItem('weavestudio_onboarding_dismissed', '1'); setDismissed(true); }}><X className="h-4 w-4" /></button></div></aside>;
};
