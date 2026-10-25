import type { AppEdge, AppNode, WorkflowTemplate, WorkspaceDocument } from '../types';
import { composeDeliverableMarkdown, composeFromWorkspace } from './deliverableEngine';
import { buildProjectExport } from './workspaceStore';

const formatTimestamp = (date = new Date()) => date.toLocaleString();

export const slugifyFilename = (value: string, extension: string) => {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return `${slug || 'weavestudio-workflow'}-${new Date().toISOString().slice(0, 10)}.${extension}`;
};

/** @deprecated Prefer composeDeliverableMarkdown — kept for callers expecting inventory-style dumps */
export const generateMarkdown = (
  nodes: AppNode[],
  edges: AppEdge[],
  title = 'Workflow Output',
  template?: WorkflowTemplate | null,
  includeProcessAppendix = false,
): string =>
  composeDeliverableMarkdown(nodes, edges, { title, template, includeProcessAppendix });

export const generateWorkspaceMarkdown = (
  workspace: WorkspaceDocument,
  template?: WorkflowTemplate | null,
  options?: { includeProcessAppendix?: boolean; forceRegenerate?: boolean },
): string => {
  if (options?.forceRegenerate) {
    return composeDeliverableMarkdown(workspace.nodes, workspace.edges, {
      title: workspace.deliverableDraft?.title || workspace.name,
      template,
      includeProcessAppendix: options.includeProcessAppendix,
    });
  }
  return composeFromWorkspace(workspace, template, {
    includeProcessAppendix: options?.includeProcessAppendix,
  });
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export const exportMarkdownFile = (markdown: string, filename: string) => {
  downloadBlob(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }), filename);
};

export const exportJsonFile = (
  nodes: AppNode[],
  edges: AppEdge[],
  title = 'Workflow Output',
  workspace?: WorkspaceDocument | null,
) => {
  if (workspace) {
    const data = buildProjectExport({
      ...workspace,
      name: title || workspace.name,
      nodes,
      edges,
    });
    downloadBlob(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' }),
      slugifyFilename(title, 'weavestudio.json'),
    );
    return;
  }

  const data = {
    format: 'weavestudio-project',
    formatVersion: 1,
    appName: 'WeaveStudio',
    title,
    exportTimestamp: new Date().toISOString(),
    generationModel: 'deterministic-local-formatting',
    nodes,
    edges,
  };

  downloadBlob(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' }),
    slugifyFilename(title, 'json'),
  );
};

export const exportPdfFile = async (markdown: string, title = 'Workflow Output') => {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF();

  const lines = markdown.split('\n');
  let y = 20;
  const margin = 15;
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;
  let pageNum = 1;

  const footer = () => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120);
    doc.text(`WeaveStudio · ${title} · ${pageNum}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    doc.setTextColor(0);
  };

  footer();

  doc.setFont('helvetica', 'normal');

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 18) {
      footer();
      doc.addPage();
      pageNum += 1;
      y = 20;
      footer();
    }
  };

  lines.forEach((line) => {
    if (line.trim() === '' || line.trim() === '---') { ensureSpace(4); y += 4; return; }
    const level = line.match(/^(#{1,3})\s+/)?.[1].length ?? 0;
    const size = level === 1 ? 18 : level === 2 ? 14 : level === 3 ? 12 : 10;
    const lineHeight = level === 1 ? 8 : level === 2 ? 7 : level === 3 ? 6 : 5.5;
    const style = level ? 'bold' : 'normal';
    const cleaned = line.replace(/^#{1,3}\s+/, '').replace(/^>\s+/, '')
      .replace(/\*\*(.*?)\*\*/g, '$1').replace(/_(.*?)_/g, '$1').replace(/`([^`]+)`/g, '$1');
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    const wrapped = doc.splitTextToSize(cleaned, contentWidth) as string[];
    for (const text of wrapped) {
      ensureSpace(lineHeight);
      // Page footers change the active font; restore the block style on every line.
      doc.setFontSize(size);
      doc.setFont('helvetica', style);
      doc.text(text, margin, y);
      y += lineHeight;
    }
    if (level) y += 3;
  });

  footer();
  doc.save(slugifyFilename(title, 'pdf'));
};

export { formatTimestamp };
