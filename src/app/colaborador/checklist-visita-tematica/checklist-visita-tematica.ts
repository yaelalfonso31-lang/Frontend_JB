import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { downloadChecklistPdf } from '../checklists/checklist-pdf';
import { ChecklistRegistryService } from '../checklists/checklist-registry.service';

interface ProcedureStep {
  id: string;
  description: string;
  details?: string[];
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

const STORAGE_KEY = 'jbuap-checklist-visita-tematica';

@Component({
  selector: 'app-checklist-visita-tematica',
  standalone: true,
  templateUrl: './checklist-visita-tematica.html',
  styleUrl: '../checklist-visita/checklist-visita.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChecklistVisitaTematicaComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private registry = inject(ChecklistRegistryService);
  readonly folioInput = input<string>();

  readonly phases: ProcedurePhase[] = [
    {
      id: 'tematica-notificacion',
      title: 'Al recibir la notificación del servicio',
      timing: 'Planeación y coordinación',
      steps: [
        { id: 'tematica-notificacion-1', description: 'Recibir la solicitud de servicio foliada proveniente del Área de Marketing.' },
        { id: 'tematica-notificacion-2', description: 'Verificar la fecha solicitada y el número de personas reservadas para el servicio.' },
        { id: 'tematica-notificacion-3', description: 'Anotar la fecha y hora en la agenda del Área de Educación y Divulgación (carpeta y Google Calendar).' },
        { id: 'tematica-notificacion-4', description: 'Identificar al académico o instructor que impartirá la visita.' },
        { id: 'tematica-notificacion-5', description: 'Verificar la disponibilidad de hora y fecha del académico que impartirá la visita temática.' },
        { id: 'tematica-notificacion-6', description: 'Llenar la Solicitud Interna de Servicios Educativos dirigida al responsable de la visita temática y recabar las firmas de las áreas de Educación y Administrativa.' },
        { id: 'tematica-notificacion-7', description: 'Confirmar la atención de la visita temática entregando la Solicitud Interna de Servicios Educativos al académico o instructor responsable.' },
        { id: 'tematica-notificacion-8', description: 'Apartar fecha y hora en la agenda de aulas para su uso.' },
        { id: 'tematica-notificacion-9', description: 'Solicitar apoyo logístico a Horticultura mediante el formato de solicitud de servicio para los círculos de bancas, si aplica (72 horas antes y con las firmas correspondientes).' },
        { id: 'tematica-notificacion-10', description: 'Enviar por correo el Programa de servicio educativo en PDF a Marketing, al profesor responsable y al académico involucrado (72 horas antes).' },
        { id: 'tematica-notificacion-11', description: 'Redactar y entregar oficio al Director de la DASU con fecha, hora, institución y número de estudiantes (72 horas antes).' }
      ]
    },
    {
      id: 'tematica-previas',
      title: '24 horas previas al servicio',
      timing: 'Preparación',
      steps: [
        {
          id: 'tematica-previas-1',
          description: 'Revisar y preparar el equipo audiovisual y los espacios necesarios:',
          details: [
            'Amplificador con batería y diadema.',
            'Aulas, proyector, laptop, bocinas y conexiones adecuadas.'
          ]
        },
        { id: 'tematica-previas-2', description: 'Iniciar el llenado del formato de ficha de visitantes.' },
        { id: 'tematica-previas-3', description: 'Iniciar el llenado de la Evaluación de Servicios Educativos Visita Guiada.' }
      ]
    },
    {
      id: 'tematica-dia-servicio',
      title: 'Día del servicio',
      timing: 'Atención y cierre',
      steps: [
        { id: 'tematica-dia-1', description: 'Preparar el equipo audiovisual en las aulas.' },
        { id: 'tematica-dia-2', description: 'Esperar al grupo en la entrada.' },
        { id: 'tematica-dia-3', description: 'Al llegar el grupo, identificar al responsable, presentarse y preguntar si puede dar inicio el servicio.' },
        { id: 'tematica-dia-4', description: 'Contar el total de estudiantes recibidos y reportarlo en la ficha de visitantes.' },
        { id: 'tematica-dia-5', description: 'Entregar la ficha de visitantes al profesor responsable, pedirle que la selle en el Área Administrativa y que la regrese al instructor responsable.' },
        { id: 'tematica-dia-6', description: 'Anotar en la evaluación el total de estudiantes, maestros y padres de familia, la hora de inicio y los minutos de retraso, si los hubo.' },
        { id: 'tematica-dia-7', description: 'Dirigir al grupo al círculo de bancas para dejar las mochilas.' },
        { id: 'tematica-dia-8', description: 'Dirigir al grupo a las aulas para proyectar el video institucional.' },
        { id: 'tematica-dia-9', description: 'Asignar al grupo con el académico responsable de la visita temática.' },
        { id: 'tematica-dia-10', description: 'Iniciar y terminar la visita temática a la hora señalada.' },
        { id: 'tematica-dia-11', description: 'Al terminar el servicio, agradecer al grupo e invitarlo a regresar.' },
        { id: 'tematica-dia-12', description: 'Recordar al grupo dónde se encuentran los sanitarios y el Kiosko.' },
        { id: 'tematica-dia-13', description: 'Anotar en la evaluación la hora de término y los minutos de retraso, si los hubo.' },
        { id: 'tematica-dia-14', description: 'Entregar la Evaluación de Servicios Educativos al profesor responsable y despedirse personalmente de él.' }
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

    const next = this.hasSavedState(folio)
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
    this.updateState({ steps: { ...state.steps, [id]: { ...state.steps[id], ...changes } } });
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
    downloadChecklistPdf('Visita Temática', 'checklist-visita-tematica', this.phases, this.checklist());
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
