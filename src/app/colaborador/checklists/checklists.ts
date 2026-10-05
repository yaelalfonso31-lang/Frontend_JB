import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  readonly checklists = signal<ChecklistSummary[]>([]);
  readonly filter = signal<ChecklistFilter>('activos');
  readonly expandedKey = signal<string | null>(null);
  readonly activeCount = computed(() => this.checklists().filter(item => item.status !== 'Concluido').length);
  readonly concludedCount = computed(() => this.checklists().filter(item => item.status === 'Concluido').length);
  readonly filteredChecklists = computed(() => this.checklists().filter(item =>
    this.filter() === 'activos' ? item.status !== 'Concluido' : item.status === 'Concluido'
  ));

  constructor() {
    effect(() => {
      this.registry.progressRevision();
      this.refresh();
    });
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
    this.checklists.set(this.registry.getChecklists());
  }

  private keyFor(item: ChecklistSummary): string {
    return `${item.kind}:${item.folio}`;
  }
}
