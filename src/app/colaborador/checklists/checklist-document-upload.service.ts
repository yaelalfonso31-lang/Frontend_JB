import { Injectable } from '@angular/core';

export type ChecklistDocumentType = 'application/pdf' | 'image/jpeg' | 'image/png';

export interface StoredChecklistDocument {
  id: string;
  scope: string;
  name: string;
  type: ChecklistDocumentType;
  size: number;
  lastModified: number;
  blob: Blob;
}

const DATABASE_NAME = 'jbuap-checklist-documents';
const STORE_NAME = 'documents';
const SCOPE_INDEX = 'scope';

@Injectable({ providedIn: 'root' })
export class ChecklistDocumentUploadService {
  private databasePromise: Promise<IDBDatabase> | null = null;

  list(scope: string): Promise<StoredChecklistDocument[]> {
    return this.runRequest('readonly', store => store.index(SCOPE_INDEX).getAll(scope));
  }

  save(scope: string, file: File, type: ChecklistDocumentType): Promise<void> {
    const record: StoredChecklistDocument = {
      id: `${scope}:${crypto.randomUUID()}`,
      scope,
      name: file.name,
      type,
      size: file.size,
      lastModified: file.lastModified,
      blob: file
    };

    return this.runRequest('readwrite', store => store.put(record)).then(() => undefined);
  }

  remove(id: string): Promise<void> {
    return this.runRequest('readwrite', store => store.delete(id)).then(() => undefined);
  }

  private runRequest<TResult>(
    mode: IDBTransactionMode,
    createRequest: (store: IDBObjectStore) => IDBRequest<TResult>
  ): Promise<TResult> {
    return this.openDatabase().then(database => new Promise<TResult>((resolve, reject) => {
      let transaction: IDBTransaction;
      let request: IDBRequest<TResult>;

      try {
        transaction = database.transaction(STORE_NAME, mode);
        request = createRequest(transaction.objectStore(STORE_NAME));
      } catch (error) {
        reject(error);
        return;
      }

      let settled = false;
      const fail = (error: DOMException | Error | null) => {
        if (settled) return;
        settled = true;
        reject(error ?? new Error('No se pudo guardar el documento en el navegador.'));
      };

      request.onerror = () => fail(request.error);
      transaction.oncomplete = () => {
        if (settled) return;
        settled = true;
        resolve(request.result);
      };
      transaction.onerror = () => fail(transaction.error);
      transaction.onabort = () => fail(transaction.error);
    }));
  }

  private openDatabase(): Promise<IDBDatabase> {
    if (this.databasePromise) return this.databasePromise;
    if (typeof indexedDB === 'undefined') {
      return Promise.reject(new Error('Este navegador no permite almacenamiento local de documentos.'));
    }

    this.databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (database.objectStoreNames.contains(STORE_NAME)) return;
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex(SCOPE_INDEX, 'scope', { unique: false });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('No se pudo abrir el almacenamiento local.'));
      request.onblocked = () => reject(new Error('El almacenamiento de documentos está bloqueado por otra pestaña.'));
    });

    return this.databasePromise;
  }
}
