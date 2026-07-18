import { Handle, Position } from '@xyflow/react';
import { BrainCircuit, FileInput, FileOutput, GitFork, Scissors, UserCheck } from 'lucide-react';
import type React from 'react';
import type { NodeData } from '../../../types';

const BaseNode = ({ data, selected, type, icon, colorClass, borderClass }: { data: NodeData, selected?: boolean, type: string, icon: React.ReactNode, colorClass: string, borderClass: string }) => {
  return (
    <div role="group" aria-label={`${type}: ${data.title || 'Untitled node'}${selected ? ', selected' : ''}`} className={`rounded-xl shadow-lg border bg-panel text-white overflow-hidden w-[280px] transition-all ${borderClass} ${selected ? 'ring-2 ring-blue-500 shadow-blue-900/50 scale-[1.02]' : ''}`}>
      <div className={`px-4 py-2 flex items-center space-x-2 border-b ${colorClass} bg-opacity-20`}>
        <div className="shrink-0">{icon}</div>
        <div className="font-semibold text-sm truncate uppercase tracking-wider">{type}</div>
        {data.status && (
          <div className="ml-auto text-xs px-2 py-0.5 rounded-full bg-black/30 border border-white/10 capitalize">
            {data.status.replace('_', ' ')}
          </div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-bold text-md leading-tight">{data.title || 'Untitled Node'}</h3>
        {data.description && <p className="text-xs text-gray-400 leading-snug">{data.description}</p>}
        {data.content && (
          <div className="mt-2 text-xs text-gray-300 bg-[#1e1e24] p-2 rounded border border-gray-800 line-clamp-3 font-mono">
            {data.content}
          </div>
        )}
      </div>
    </div>
  );
};

export const InputNode = ({ data, selected }: { data: NodeData, selected?: boolean }) => (
  <>
    <BaseNode 
      data={data} 
      selected={selected}
      type="Input" 
      icon={<FileInput className="w-4 h-4 text-emerald-400" />} 
      colorClass="border-emerald-500/30" 
      borderClass="border-emerald-500/50" 
    />
    <Handle type="source" position={Position.Right} />
  </>
);

export const TransformNode = ({ data, selected }: { data: NodeData, selected?: boolean }) => (
  <>
    <Handle type="target" position={Position.Left} />
    <BaseNode 
      data={data} 
      selected={selected}
      type="Transform" 
      icon={<Scissors className="w-4 h-4 text-blue-400" />} 
      colorClass="border-blue-500/30" 
      borderClass="border-blue-500/50" 
    />
    <Handle type="source" position={Position.Right} />
  </>
);

export const DecisionNode = ({ data, selected }: { data: NodeData, selected?: boolean }) => (
  <>
    <Handle type="target" position={Position.Left} />
    <BaseNode 
      data={data} 
      selected={selected}
      type="Decision" 
      icon={<GitFork className="w-4 h-4 text-amber-400" />} 
      colorClass="border-amber-500/30" 
      borderClass="border-amber-500/50" 
    />
    <Handle type="source" position={Position.Right} />
  </>
);

export const ReviewNode = ({ data, selected }: { data: NodeData, selected?: boolean }) => (
  <>
    <Handle type="target" position={Position.Left} />
    <BaseNode 
      data={data} 
      selected={selected}
      type="Review" 
      icon={<UserCheck className="w-4 h-4 text-purple-400" />} 
      colorClass="border-purple-500/30" 
      borderClass="border-purple-500/50" 
    />
    <Handle type="source" position={Position.Right} />
  </>
);

export const AiAssistNode = ({ data, selected }: { data: NodeData, selected?: boolean }) => (
  <>
    <Handle type="target" position={Position.Left} />
    <BaseNode
      data={data}
      selected={selected}
      type="AI Assist Blueprint"
      icon={<BrainCircuit className="w-4 h-4 text-cyan-300" />}
      colorClass="border-cyan-500/30"
      borderClass="border-cyan-500/50"
    />
    <Handle type="source" position={Position.Right} />
  </>
);

export const OutputNode = ({ data, selected }: { data: NodeData, selected?: boolean }) => (
  <>
    <Handle type="target" position={Position.Left} />
    <BaseNode 
      data={data} 
      selected={selected}
      type="Output" 
      icon={<FileOutput className="w-4 h-4 text-rose-400" />} 
      colorClass="border-rose-500/30" 
      borderClass="border-rose-500/50" 
    />
  </>
);
