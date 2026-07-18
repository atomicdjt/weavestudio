import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { AccessibleDialog } from '../ui/AccessibleDialog';

const steps = [
  ['Start with source', 'Paste notes, transcripts, or research fragments in Source material. Use a sample whenever you want a safe starting point.'],
  ['Build a readable workflow', 'Apply source to the Input node or split it into editable steps. Use the Outline button whenever you prefer a linear reading order.'],
  ['Review before sharing', 'Validate structure, generate an editable deliverable, and export a project backup before clearing browser data.'],
] as const;

export const GuidedTour = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState(0);
  useEffect(() => () => { try { localStorage.setItem('weavestudio_tour_dismissed', '1'); } catch { /* browser privacy mode */ } }, []);
  const complete = () => { try { localStorage.setItem('weavestudio_tour_dismissed', '1'); } catch { /* browser privacy mode */ } onClose(); };
  return <AccessibleDialog label="WeaveStudio quick tour" onClose={complete} className="w-full max-w-lg rounded-xl border border-blue-500/30 bg-panel p-6 shadow-2xl"><div className="flex items-center gap-2 text-blue-200"><CheckCircle2 className="h-5 w-5" /><span className="text-sm font-semibold">Quick tour · {step + 1} of {steps.length}</span></div><h2 className="mt-4 text-xl font-bold text-white">{steps[step][0]}</h2><p className="mt-3 text-sm leading-relaxed text-gray-300">{steps[step][1]}</p><div className="mt-6 flex items-center justify-between gap-3"><button type="button" className="text-sm text-gray-400 hover:text-white" onClick={complete}>Skip tour</button>{step + 1 === steps.length ? <button type="button" onClick={complete} className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Start creating</button> : <button type="button" onClick={() => setStep((current) => current + 1)} className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Next<ArrowRight className="h-4 w-4" /></button>}</div></AccessibleDialog>;
};
