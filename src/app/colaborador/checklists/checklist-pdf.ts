import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ChecklistPdfStep {
  id: string;
  description: string;
  details?: string[];
}

export interface ChecklistPdfPhase {
  title: string;
  timing: string;
  steps: ChecklistPdfStep[];
}

export interface ChecklistPdfState {
  folio: string;
  steps: Record<string, { completed: boolean; date: string; performer: string }>;
}

export function downloadChecklistPdf(
  service: string,
  fileName: string,
  phases: ChecklistPdfPhase[],
  state: ChecklistPdfState
): void {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const left = 12;
  const pageHeight = pdf.internal.pageSize.getHeight();
  let cursorY = 33;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(15);
  pdf.text('JARDIN BOTANICO UNIVERSITARIO BUAP', left, 14);
  pdf.setFontSize(12);
  pdf.text('Lista de procedimientos', left, 21);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(`Servicio: ${service}`, left, 27);
  pdf.text(`Folio: ${state.folio || 'Sin asignar'}`, 285, 27, { align: 'right' });

  for (const phase of phases) {
    if (cursorY > pageHeight - 28) {
      pdf.addPage();
      cursorY = 16;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text(phase.title.toLocaleUpperCase('es-MX'), left, cursorY);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text(phase.timing, left, cursorY + 4);

    const rows = phase.steps.map((step, index) => {
      const progress = state.steps[step.id];
      const description = [step.description, ...(step.details ?? []).map(detail => `- ${detail}`)].join('\n');
      return [
        String(index + 1),
        description,
        progress?.completed ? 'X' : '',
        progress?.date || '',
        progress?.performer || ''
      ];
    });

    autoTable(pdf, {
      startY: cursorY + 6,
      margin: { left, right: left, bottom: 12 },
      head: [['#', 'Procedimiento', 'Hecho', 'Fecha', 'Realizo']],
      body: rows,
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 2, overflow: 'linebreak', valign: 'middle' },
      headStyles: { fillColor: [23, 96, 68], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 9, halign: 'center' },
        1: { cellWidth: 177 },
        2: { cellWidth: 16, halign: 'center' },
        3: { cellWidth: 31 },
        4: { cellWidth: 40 }
      }
    });

    const table = (pdf as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable;
    cursorY = (table?.finalY ?? cursorY) + 9;
  }

  pdf.save(`${fileName}-${state.folio || 'sin-folio'}.pdf`);
}
