import { Injectable, signal } from '@angular/core';

export type ChecklistKind = 'visita-guiada' | 'visita-guiada-taller' | 'visita-tematica';
export type ChecklistStatus = 'Pendiente de inicio' | 'En proceso' | 'Concluido';

export interface SubmittedRequestChecklist {
  folio: string;
  school: string;
  date: string;
  services: string[];
}

export interface ChecklistSummary {
  kind: ChecklistKind;
  service: string;
  route: string;
  folio: string;
  school: string;
  date: string;
  completedSteps: number;
  totalSteps: number;
  progressPercent: number;
  currentPhase: string;
  status: ChecklistStatus;
}

interface ProcedureProgress {
  completed: boolean;
  date: string;
  performer: string;
}

interface StoredChecklist {
  folio: string;
  steps: Record<string, ProcedureProgress>;
}

interface ChecklistRecord {
  kind: ChecklistKind;
  folio: string;
  school: string;
  date: string;
  registeredAt: string;
}

interface ChecklistConfiguration {
  service: string;
  route: string;
  storagePrefix: string;
  phases: Array<{ prefix: string; count: number; title: string }>;
}

const REGISTRY_KEY = 'jbuap-checklist-registry';

const CONFIGURATIONS: Record<ChecklistKind, ChecklistConfiguration> = {
  'visita-guiada': {
    service: 'Visita guiada',
    route: '/colaborador/checklist-visita',
    storagePrefix: 'jbuap-checklist-visita-guiada',
    phases: [
      { prefix: 'notificacion', count: 10, title: 'Al recibir la notificación del servicio' },
      { prefix: 'previas', count: 3, title: '24 horas previas al servicio' },
      { prefix: 'dia', count: 14, title: 'Día del servicio' }
    ]
  },
  'visita-guiada-taller': {
    service: 'Visita guiada + taller',
    route: '/colaborador/checklist-visita-taller',
    storagePrefix: 'jbuap-checklist-visita-guiada-taller',
    phases: [
      { prefix: 'taller-notificacion', count: 16, title: 'Al recibir la notificación del servicio' },
      { prefix: 'taller-previas', count: 3, title: '24 horas previas al servicio' },
      { prefix: 'taller-dia', count: 14, title: 'Día del servicio' }
    ]
  },
  'visita-tematica': {
    service: 'Visita temática',
    route: '/colaborador/checklist-visita-tematica',
    storagePrefix: 'jbuap-checklist-visita-tematica',
    phases: [
      { prefix: 'tematica-notificacion', count: 11, title: 'Al recibir la notificación del servicio' },
      { prefix: 'tematica-previas', count: 3, title: '24 horas previas al servicio' },
      { prefix: 'tematica-dia', count: 14, title: 'Día del servicio' }
    ]
  }
};

@Injectable({ providedIn: 'root' })
export class ChecklistRegistryService {
  readonly progressRevision = signal(0);

  notifyProgressChange(): void {
    this.progressRevision.update(revision => revision + 1);
  }

  registerSubmittedRequest(request: SubmittedRequestChecklist): void {
    const folio = request.folio.trim();
    if (!folio) return;

    const kinds = this.resolveChecklistKinds(request.services);
    if (kinds.length === 0) return;

    try {
      const records = this.readRegistry();
      for (const kind of kinds) {
        const configuration = CONFIGURATIONS[kind];
        const checklistKey = this.storageKey(configuration, folio);
        const currentState = localStorage.getItem(checklistKey);

        if (!currentState) {
          localStorage.setItem(checklistKey, JSON.stringify(this.createInitialChecklist(folio, configuration)));
          localStorage.setItem(`${configuration.storagePrefix}:active`, folio);
        }

        const existingIndex = records.findIndex(record => record.kind === kind && record.folio === folio);
        const record: ChecklistRecord = {
          kind,
          folio,
          school: request.school,
          date: request.date,
          registeredAt: new Date().toISOString()
        };

        if (existingIndex >= 0) records[existingIndex] = { ...records[existingIndex], ...record };
        else records.push(record);
      }

      localStorage.setItem(REGISTRY_KEY, JSON.stringify(records));
      this.notifyProgressChange();
    } catch {
      // Una falla del almacenamiento local no debe invalidar una solicitud aceptada por el backend.
    }
  }

  getChecklists(): ChecklistSummary[] {
    try {
      return this.readRegistry()
        .map(record => this.toSummary(record))
        .sort((left, right) => right.date.localeCompare(left.date) || right.folio.localeCompare(left.folio));
    } catch {
      return [];
    }
  }

  private resolveChecklistKinds(services: string[]): ChecklistKind[] {
    const selected = new Set(services);
    const hasVisit = selected.has('visita_guiada') || selected.has('visita_tematica');
    const hasWorkshop = services.some(service => !['visita_guiada', 'visita_tematica'].includes(service));
    const kinds: ChecklistKind[] = [];

    if (selected.has('visita_tematica')) kinds.push('visita-tematica');
    if (selected.has('visita_guiada')) {
      kinds.push(hasVisit && hasWorkshop ? 'visita-guiada-taller' : 'visita-guiada');
    }

    return kinds;
  }

  private readRegistry(): ChecklistRecord[] {
    const stored = localStorage.getItem(REGISTRY_KEY);
    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((record): record is ChecklistRecord =>
      typeof record === 'object' &&
      record !== null &&
      'kind' in record &&
      record.kind in CONFIGURATIONS &&
      'folio' in record &&
      typeof record.folio === 'string'
    );
  }

  private toSummary(record: ChecklistRecord): ChecklistSummary {
    const configuration = CONFIGURATIONS[record.kind];
    const initial = this.createInitialChecklist(record.folio, configuration);
    let stored: Partial<StoredChecklist> = {};

    try {
      const saved = localStorage.getItem(this.storageKey(configuration, record.folio));
      if (saved) stored = JSON.parse(saved) as Partial<StoredChecklist>;
    } catch {
      stored = {};
    }

    const steps = { ...initial.steps, ...stored.steps };
    const totalSteps = Object.keys(initial.steps).length;
    const completedSteps = Object.values(steps).filter(step => step.completed).length;
    const currentPhase = configuration.phases.find(phase =>
      Array.from({ length: phase.count }, (_, index) => `${phase.prefix}-${index + 1}`)
        .some(stepId => !steps[stepId]?.completed)
    )?.title ?? 'Servicio concluido';
    const status: ChecklistStatus = completedSteps === totalSteps
      ? 'Concluido'
      : completedSteps > 0
        ? 'En proceso'
        : 'Pendiente de inicio';

    return {
      ...record,
      service: configuration.service,
      route: configuration.route,
      completedSteps,
      totalSteps,
      progressPercent: Math.round((completedSteps / totalSteps) * 100),
      currentPhase,
      status
    };
  }

  private createInitialChecklist(folio: string, configuration: ChecklistConfiguration): StoredChecklist {
    const steps: Record<string, ProcedureProgress> = {};
    for (const phase of configuration.phases) {
      for (let stepNumber = 1; stepNumber <= phase.count; stepNumber++) {
        steps[`${phase.prefix}-${stepNumber}`] = { completed: false, date: '', performer: '' };
      }
    }

    return { folio, steps };
  }

  private storageKey(configuration: ChecklistConfiguration, folio: string): string {
    return `${configuration.storagePrefix}:${encodeURIComponent(folio || 'borrador')}`;
  }
}
