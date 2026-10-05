import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { downloadChecklistPdf } from '../checklists/checklist-pdf';
import { ChecklistRegistryService } from '../checklists/checklist-registry.service';

interface ProcedureStep {
  id: string;
  description: string;
}

interface ProcedurePhase {
  id: string;
  title: string;
  timing: string;
  steps: ProcedureStep[];
}

interface StepProgress {
  completed: boolean;
  date: string;
  performer: string;
}

interface ChecklistState {
  folio: string;
  steps: Record<string, StepProgress>;
}

const STORAGE_KEY = 'jbuap-checklist-visita-guiada';

@Component({
  selector: 'app-checklist-visita',
  standalone: true,
  templateUrl: './checklist-visita.html',
  styleUrl: './checklist-visita.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChecklistVisitaComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private registry = inject(ChecklistRegistryService);
  readonly folioInput = input<string>();

  readonly phases: ProcedurePhase[] = [
    {
      id: 'notificacion',
      title: 'Al recibir la notificación del servicio',
      timing: 'Planeación y coordinación',
      steps: [
        { id: 'notificacion-1', description: 'Recibir la solicitud de servicio foliada proveniente del Área de Marketing.' },
        { id: 'notificacion-2', description: 'Verificar la fecha solicitada y el número de personas reservadas para el servicio.' },
        { id: 'notificacion-3', description: 'Anotar la fecha y hora en la agenda del Área de Educación y Divulgación (carpeta y Google Calendar).' },
        { id: 'notificacion-4', description: 'Identificar al académico o instructor que impartirá la visita.' },
        { id: 'notificacion-5', description: 'Verificar la disponibilidad de hora y fecha del académico o instructor responsable.' },
        { id: 'notificacion-6', description: 'Llenar la Solicitud Interna de Servicios Educativos dirigida al responsable de la visita y recabar las firmas de las áreas de Educación y Administrativa.' },
        { id: 'notificacion-7', description: 'Confirmar la atención de la visita entregando la Solicitud Interna de Servicios Educativos al académico o instructor responsable.' },
        { id: 'notificacion-8', description: 'Solicitar apoyo logístico a Horticultura mediante el formato de solicitud de servicio para los círculos de bancas, si aplica (72 horas antes).' },
        { id: 'notificacion-9', description: 'Enviar el Programa de servicio educativo en PDF a Marketing, al profesor responsable y al personal académico e instructor involucrado (72 horas antes).' },
        { id: 'notificacion-10', description: 'Redactar y entregar oficio al Director de la DASU con fecha, hora, institución y número de estudiantes (72 horas antes).' }
      ]
    },
    {
      id: 'previas',
      title: '24 horas previas al servicio',
      timing: 'Preparación',
      steps: [
        { id: 'previas-1', description: 'Revisar y preparar chaleco, gafete, amplificador con batería y diadema.' },
        { id: 'previas-2', description: 'Iniciar el llenado del formato de ficha de visitantes.' },
        { id: 'previas-3', description: 'Iniciar el llenado de la Evaluación de Servicios Educativos Visita Guiada.' }
      ]
    },
    {
      id: 'dia-servicio',
      title: 'Día del servicio',
      timing: 'Atención y cierre',
      steps: [
        { id: 'dia-1', description: 'Portar la vestimenta institucional y llevar chaleco y gafete de identificación.' },
        { id: 'dia-2', description: 'Presentarse 15 minutos antes de la hora programada.' },
        { id: 'dia-3', description: 'Revisar el material: amplificador con batería, diadema, ficha de visitantes y evaluación.' },
        { id: 'dia-4', description: 'Recibir al profesor responsable y al grupo visitante.' },
        { id: 'dia-5', description: 'Contar el total de estudiantes asistentes.' },
        { id: 'dia-6', description: 'Contar el total de profesores y padres de familia asistentes.' },
        { id: 'dia-7', description: 'Registrar en la ficha de visitantes el total de estudiantes, profesores y padres de familia.' },
        { id: 'dia-8', description: 'Registrar en la evaluación el total de estudiantes, profesores y padres de familia.' },
        { id: 'dia-9', description: 'Gestionar el sello correspondiente en el Área Administrativa.' },
        { id: 'dia-10', description: 'Dirigir al grupo al círculo de bancas y organizarlo para iniciar la actividad.' },
        { id: 'dia-11', description: 'Iniciar el recorrido a la hora señalada.' },
        { id: 'dia-12', description: 'Informar al grupo dónde se encuentran los sanitarios y el kiosko.' },
        { id: 'dia-13', description: 'Despedir al grupo, anotar la hora de término y registrar los minutos de retraso, si los hubo.' },
        { id: 'dia-14', description: 'Entregar la evaluación de Servicios Educativos al profesor responsable.' }
      ]
    }
  ];

  readonly checklist = signal<ChecklistState>(this.loadActiveState());
  readonly totalSteps = this.phases.reduce((total, phase) => total + phase.steps.length, 0);
  readonly completedSteps = computed(() => Object.values(this.checklist().steps).filter(step => step.completed).length);
  readonly progressPercent = computed(() => Math.round((this.completedSteps() / this.totalSteps) * 100));
  readonly currentPhase = computed(() =>
    this.phases.find(phase => phase.steps.some(step => !this.checklist().steps[step.id]?.completed))?.title
      ?? 'Servicio concluido'
  );

  ngOnInit(): void {
    const folio = this.folioInput() ?? this.route.snapshot.queryParamMap.get('folio') ?? localStorage.getItem(`${STORAGE_KEY}:active`) ?? '';
    this.checklist.set(this.loadState(folio));
  }

  updateFolio(folio: string): void {
    const current = this.checklist();
    if (folio === current.folio) return;

    const targetExists = this.hasSavedState(folio);
    const next = targetExists
      ? this.loadState(folio)
      : !current.folio
        ? { ...current, folio }
        : this.createInitialState(folio);

    this.persistState(current);
    this.checklist.set(next);
    this.persistState(next);
  }

  updateStep(id: string, changes: Partial<StepProgress>): void {
    const state = this.checklist();
    this.updateState({
      steps: {
        ...state.steps,
        [id]: { ...state.steps[id], ...changes }
      }
    });
  }

  phaseCompleted(phase: ProcedurePhase): number {
    return phase.steps.filter(step => this.checklist().steps[step.id]?.completed).length;
  }

  phaseStatus(phase: ProcedurePhase): string {
    const completed = this.phaseCompleted(phase);
    if (completed === phase.steps.length) return 'Completada';
    if (completed > 0 || this.currentPhase() === phase.title) return 'En curso';
    return 'Pendiente';
  }

  downloadPdf(): void {
    downloadChecklistPdf('Visita Guiada', 'checklist-visita-guiada', this.phases, this.checklist());
  }

  private updateState(changes: Partial<ChecklistState>): void {
    const next = { ...this.checklist(), ...changes };
    this.checklist.set(next);
    this.persistState(next);
  }

  private persistState(state: ChecklistState): void {
    try {
      localStorage.setItem(this.storageKey(state.folio), JSON.stringify(state));
      localStorage.setItem(`${STORAGE_KEY}:active`, state.folio);
      this.registry.notifyProgressChange();
    } catch {
      // El checklist sigue disponible aunque el navegador bloquee el almacenamiento local.
    }
  }

  private createInitialState(folio = ''): ChecklistState {
    const initial: ChecklistState = { folio, steps: {} };
    for (const phase of this.phases) {
      for (const step of phase.steps) {
        initial.steps[step.id] = { completed: false, date: '', performer: '' };
      }
    }
    return initial;
  }

  private loadActiveState(): ChecklistState {
    try {
      const folio = this.route.snapshot.queryParamMap.get('folio') ?? localStorage.getItem(`${STORAGE_KEY}:active`) ?? '';
      return this.loadState(folio);
    } catch {
      return this.createInitialState();
    }
  }

  private loadState(folio: string): ChecklistState {
    const initial = this.createInitialState(folio);

    try {
      const stored = localStorage.getItem(this.storageKey(folio));
      if (!stored) return initial;
      const saved = JSON.parse(stored) as Partial<ChecklistState>;
      return {
        folio: saved.folio ?? initial.folio,
        steps: { ...initial.steps, ...saved.steps }
      };
    } catch {
      return initial;
    }
  }

  private hasSavedState(folio: string): boolean {
    try {
      return localStorage.getItem(this.storageKey(folio)) !== null;
    } catch {
      return false;
    }
  }

  private storageKey(folio: string): string {
    return `${STORAGE_KEY}:${encodeURIComponent(folio || 'borrador')}`;
  }
}
