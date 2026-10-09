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

const STORAGE_KEY = 'jbuap-checklist-visita-guiada-taller';

@Component({
  selector: 'app-checklist-visita-taller',
  standalone: true,
  templateUrl: './checklist-visita-taller.html',
  styleUrl: '../checklist-visita/checklist-visita.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChecklistVisitaTallerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private registry = inject(ChecklistRegistryService);
  readonly folioInput = input<string>();

  readonly phases: ProcedurePhase[] = [
    {
      id: 'taller-notificacion',
      title: 'Al recibir la notificación del servicio',
      timing: 'Planeación y coordinación',
      steps: [
        { id: 'taller-notificacion-1', description: 'Recibir la solicitud de servicio foliada proveniente del Área de Marketing.' },
        { id: 'taller-notificacion-2', description: 'Verificar la fecha solicitada y el número de personas reservadas para el servicio.' },
        { id: 'taller-notificacion-3', description: 'Anotar la fecha y hora en la agenda del Área de Educación y Divulgación (carpeta y Google Calendar).' },
        { id: 'taller-notificacion-4', description: 'Identificar al académico o instructor que impartirá la visita.' },
        { id: 'taller-notificacion-5', description: 'Identificar al académico y las áreas que impartirán el taller.' },
        { id: 'taller-notificacion-6', description: 'Verificar la disponibilidad de hora y fecha de los académicos o instructores que impartirán la visita y el taller.' },
        { id: 'taller-notificacion-7', description: 'Llenar las Solicitudes Internas de Servicios Educativos dirigidas a los responsables de la visita y el taller, con las firmas de las áreas de Educación y Administrativa.' },
        { id: 'taller-notificacion-8', description: 'Confirmar la atención de la visita guiada y el taller entregando la Solicitud Interna de Servicios Educativos al académico o instructor responsable.' },
        { id: 'taller-notificacion-9', description: 'Verificar la disponibilidad de hora, fecha y espacios para impartir el taller.' },
        { id: 'taller-notificacion-10', description: 'Apartar fecha y hora en la agenda de aulas para su uso, si aplica.' },
        { id: 'taller-notificacion-11', description: 'Verificar el stock de material existente e identificar el material faltante.' },
        { id: 'taller-notificacion-12', description: 'Solicitar el recurso económico para comprar material mediante el formato de solicitud de compras (15 días de anticipación).' },
        { id: 'taller-notificacion-13', description: 'Preparar el material necesario y un stock excedente para 20 personas.' },
        { id: 'taller-notificacion-14', description: 'Solicitar apoyo logístico a Horticultura mediante el formato de solicitud de servicio para círculos de bancas, mesas y bancos, si aplica (72 horas antes y con las firmas correspondientes).' },
        { id: 'taller-notificacion-15', description: 'Enviar por correo el Programa de servicio educativo en PDF a Marketing, al profesor responsable y a los académicos e instructores involucrados (72 horas antes).' },
        { id: 'taller-notificacion-16', description: 'Redactar y entregar oficio al Director de la DASU con fecha, hora, institución y número de estudiantes (72 horas antes).' }
      ]
    },
    {
      id: 'taller-previas',
      title: '24 horas previas al servicio',
      timing: 'Preparación',
      steps: [
        {
          id: 'taller-previas-1',
          description: 'Revisar y preparar el material y los espacios necesarios:',
          details: [
            'Chaleco y gafete.',
            'Amplificador con batería y diadema.',
            'Aulas, proyector, laptop, bocinas y conexiones necesarias, si aplica.',
            'Materiales y espacios específicos para el taller de cada área.'
          ]
        },
        { id: 'taller-previas-2', description: 'Iniciar el llenado del formato de ficha de visitantes.' },
        { id: 'taller-previas-3', description: 'Iniciar el llenado de la Evaluación de Servicios Educativos Visita Guiada.' }
      ]
    },
    {
      id: 'taller-dia-servicio',
      title: 'Día del servicio',
      timing: 'Atención y cierre',
      steps: [
        { id: 'taller-dia-1', description: 'Portar la vestimenta conforme al Manual del Educador y llevar chaleco y gafete.' },
        { id: 'taller-dia-2', description: 'Presentarse 15 minutos antes de la hora programada.' },
        { id: 'taller-dia-3', description: 'Revisar el material de la visita y el taller: amplificador, diadema, ficha, evaluación y materiales preparados.' },
        { id: 'taller-dia-4', description: 'Recibir al profesor responsable y al grupo visitante.' },
        { id: 'taller-dia-5', description: 'Contar el total de estudiantes asistentes.' },
        { id: 'taller-dia-6', description: 'Registrar el total de estudiantes en la ficha de visitantes.' },
        { id: 'taller-dia-7', description: 'Entregar la ficha de visitantes al profesor responsable para gestionar el sello en el Área Administrativa.' },
        { id: 'taller-dia-8', description: 'Registrar en la evaluación el total de estudiantes, maestros y padres de familia recibidos.' },
        { id: 'taller-dia-9', description: 'Anotar en la evaluación la hora de inicio y los minutos de retraso, si los hubo.' },
        { id: 'taller-dia-10', description: 'Dirigir al grupo al círculo de bancas o al área asignada para el taller.' },
        { id: 'taller-dia-11', description: 'Impartir la visita guiada a la hora señalada.' },
        { id: 'taller-dia-12', description: 'Impartir el taller en el espacio y horario programados.' },
        { id: 'taller-dia-13', description: 'Agradecer la visita e indicar la ubicación de los sanitarios y el Kiosko.' },
        { id: 'taller-dia-14', description: 'Registrar la hora de término y los minutos de retraso, si los hubo; entregar la evaluación al profesor responsable y despedir al grupo.' }
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
    downloadChecklistPdf('Visita Guiada + Taller', 'checklist-visita-guiada-taller', this.phases, this.checklist());
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
