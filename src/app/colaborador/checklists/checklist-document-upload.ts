import { ChangeDetectionStrategy, Component, inject, input, OnChanges, OnDestroy, signal } from '@angular/core';
import {
  ChecklistDocumentType,
  ChecklistDocumentUploadService,
  StoredChecklistDocument
} from './checklist-document-upload.service';

interface ChecklistDocumentView {
  id: string;
  name: string;
  size: number;
  url: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const FILE_TYPES: Record<string, { mimeType: ChecklistDocumentType; signature: number[] }> = {
  '.pdf': { mimeType: 'application/pdf', signature: [0x25, 0x50, 0x44, 0x46, 0x2d] },
  '.jpg': { mimeType: 'image/jpeg', signature: [0xff, 0xd8, 0xff] },
  '.jpeg': { mimeType: 'image/jpeg', signature: [0xff, 0xd8, 0xff] },
  '.png': { mimeType: 'image/png', signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }
};

@Component({
  selector: 'app-checklist-document-upload',
  standalone: true,
  templateUrl: './checklist-document-upload.html',
  styleUrl: './checklist-document-upload.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChecklistDocumentUploadComponent implements OnChanges, OnDestroy {
  private documentService = inject(ChecklistDocumentUploadService);
  readonly checklistKey = input.required<string>();
  readonly folio = input.required<string>();
  readonly stepId = input.required<string>();
  readonly disabled = input(false);
  readonly documents = signal<ChecklistDocumentView[]>([]);
  readonly message = signal('');
  readonly error = signal('');

  private objectUrls: string[] = [];
  private loadRevision = 0;

  ngOnChanges(): void {
    void this.loadDocuments();
  }

  ngOnDestroy(): void {
    this.revokeObjectUrls();
  }

  async onFilesSelected(event: Event): Promise<void> {
    const inputElement = event.target;
    if (!(inputElement instanceof HTMLInputElement)) return;

    this.message.set('');
    this.error.set('');
    const files = Array.from(inputElement.files ?? []);
    inputElement.value = '';
    const failures: string[] = [];
    let saved = 0;

    for (const file of files) {
      try {
        const type = await this.validateFile(file);
        await this.documentService.save(this.scope(), file, type);
        saved++;
      } catch (error) {
        failures.push(error instanceof Error ? `${file.name}: ${error.message}` : file.name);
      }
    }

    if (saved > 0) this.message.set(saved === 1 ? 'Documento agregado.' : `Se agregaron ${saved} documentos.`);
    if (failures.length > 0) this.error.set(failures.join(' '));
    if (saved > 0) await this.loadDocuments();
  }

  async removeDocument(document: ChecklistDocumentView): Promise<void> {
    this.message.set('');
    this.error.set('');
    try {
      await this.documentService.remove(document.id);
      this.message.set('Documento eliminado del almacenamiento local.');
      await this.loadDocuments();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo eliminar el documento.');
    }
  }

  formatSize(size: number): string {
    return size < 1024 * 1024
      ? `${Math.max(1, Math.round(size / 1024))} KB`
      : `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  private async validateFile(file: File): Promise<ChecklistDocumentType> {
    if (file.size === 0) throw new Error('El archivo está vacío.');
    if (file.size > MAX_FILE_SIZE) throw new Error('El tamaño máximo es 10 MB por archivo.');

    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    const definition = FILE_TYPES[extension];
    if (!definition) throw new Error('Solo se permiten archivos PDF, JPG/JPEG o PNG.');
    if (file.type && file.type !== definition.mimeType) {
      throw new Error('El tipo de archivo no coincide con su extensión.');
    }

    const bytes = new Uint8Array(await file.slice(0, definition.signature.length).arrayBuffer());
    if (!definition.signature.every((byte, index) => bytes[index] === byte)) {
      throw new Error('El contenido del archivo no corresponde a un PDF, JPG/JPEG o PNG válido.');
    }

    return definition.mimeType;
  }

  private async loadDocuments(): Promise<void> {
    const revision = ++this.loadRevision;
    this.revokeObjectUrls();
    this.message.set('');
    this.error.set('');

    try {
      const records = await this.documentService.list(this.scope());
      if (revision !== this.loadRevision) return;
      this.documents.set(records.map(record => this.toView(record)));
    } catch (error) {
      if (revision !== this.loadRevision) return;
      this.documents.set([]);
      this.error.set(error instanceof Error ? error.message : 'No se pudieron cargar los documentos.');
    }
  }

  private toView(record: StoredChecklistDocument): ChecklistDocumentView {
    const url = URL.createObjectURL(record.blob);
    this.objectUrls.push(url);
    return { id: record.id, name: record.name, size: record.size, url };
  }

  private scope(): string {
    return `${this.checklistKey()}|${this.folio()}|${this.stepId()}`;
  }

  private revokeObjectUrls(): void {
    for (const url of this.objectUrls) URL.revokeObjectURL(url);
    this.objectUrls = [];
  }
}
