import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChecklistVisitaComponent } from '../checklist-visita/checklist-visita';
import { ChecklistVisitaTallerComponent } from '../checklist-visita-taller/checklist-visita-taller';
import { ChecklistVisitaTematicaComponent } from '../checklist-visita-tematica/checklist-visita-tematica';
import { ChecklistRegistryService, ChecklistSummary } from './checklist-registry.service';

type ChecklistFilter = 'activos' | 'concluidos';

@Component({
  selector: 'app-checklists',
  standalone: true,
  imports: [CommonModule, ChecklistVisitaComponent, ChecklistVisitaTallerComponent, ChecklistVisitaTematicaComponent],
  templateUrl: './checklists.html',
  styleUrl: './checklists.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChecklistsComponent {
  private registry = inject(ChecklistRegistryService);
  private http = inject(HttpClient);

  readonly checklists = signal<ChecklistSummary[]>([]);
  readonly filter = signal<ChecklistFilter>('activos');
  readonly expandedKey = signal<string | null>(null);
  readonly actualizando = signal(false);
  readonly errorActualizacion = signal('');
  readonly activeCount = computed(() => this.checklists().filter(item => item.status !== 'Concluido').length);
  readonly concludedCount = computed(() => this.checklists().filter(item => item.status === 'Concluido').length);
  readonly filteredChecklists = computed(() => this.checklists().filter(item =>
    this.filter() === 'activos' ? item.status !== 'Concluido' : item.status === 'Concluido'
  ));

  constructor() {
    effect(() => {
      this.registry.progressRevision();
      this.checklists.set(this.registry.getChecklists());
    });
    this.refresh();
  }

  setFilter(filter: ChecklistFilter): void {
    this.filter.set(filter);
    this.expandedKey.set(null);
  }

  toggleExpanded(item: ChecklistSummary): void {
    const key = this.keyFor(item);
    this.expandedKey.set(this.expandedKey() === key ? null : key);
  }

  isExpanded(item: ChecklistSummary): boolean {
    return this.expandedKey() === this.keyFor(item);
  }

  detailsId(item: ChecklistSummary): string {
    return `checklist-${this.keyFor(item).replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  }

  refresh(): void {
    this.actualizando.set(true);
    this.errorActualizacion.set('');
    this.http.get<Array<{
      folio?: string;
      solicitante?: string;
      escuela?: string;
      fechaVisita?: string;
      servicios?: string[] | string;
      services?: string[] | string;
      estado?: string;
    }>>('/api/monitor/solicitudes').subscribe({
      next: (solicitudes) => {
        for (const solicitud of solicitudes) {
          if (!solicitud.folio) continue;
          const rawServices = solicitud.servicios ?? solicitud.services ?? [];
          const services = Array.isArray(rawServices)
            ? rawServices
            : rawServices.split(',').map(service => service.trim()).filter(Boolean);
          if (!services.length) continue;

          const status = solicitud.estado?.toLowerCase();
          if (status !== 'pendiente' && status !== 'aprobada' && status !== 'rechazada' && status !== 'correccion') {
            continue;
          }

          this.registry.registerSubmittedRequest({
            folio: solicitud.folio,
            school: solicitud.solicitante || solicitud.escuela || '',
            date: solicitud.fechaVisita || '',
            services,
            status
          });
        }
        this.checklists.set(this.registry.getChecklists());
        this.actualizando.set(false);
      },
      error: (error) => {
        console.error('Error al actualizar los checklists:', error);
        this.errorActualizacion.set('No se pudo actualizar el listado. Intenta nuevamente.');
        this.actualizando.set(false);
      }
    });
  }

  private keyFor(item: ChecklistSummary): string {
    return `${item.kind}:${item.folio}`;
  }
}
