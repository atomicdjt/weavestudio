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
    if (line.startsWith('# ')) {
      ensureSpace(14);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      const wrapped = doc.splitTextToSize(line.replace(/^#\s+/, ''), contentWidth);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 8 + 4;
      return;
    }

    if (line.startsWith('## ')) {
      ensureSpace(12);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const wrapped = doc.splitTextToSize(line.replace(/^##\s+/, ''), contentWidth);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 7 + 3;
      return;
    }

    if (line.startsWith('### ')) {
      ensureSpace(10);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const wrapped = doc.splitTextToSize(line.replace(/^###\s+/, ''), contentWidth);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 6 + 2;
      return;
    }

    if (line.trim() === '' || line.trim() === '---') {
      y += 4;
      return;
    }

    // Strip light markdown emphasis for PDF text layer
    const cleaned = line
      .replace(/^>\s+/, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      .replace(/`([^`]+)`/g, '$1');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const wrapped = doc.splitTextToSize(cleaned, contentWidth);
    ensureSpace(wrapped.length * 5.5);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 5.5;
  });

  footer();
  doc.save(slugifyFilename(title, 'pdf'));
};

export { formatTimestamp };
