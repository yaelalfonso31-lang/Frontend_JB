import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Solicitud {
  id: number;
  solicitante: string;
  escuela: string;
  fechaVisita: string;
  horaVisita?: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'correccion';
  numeroVisitantes: number;
  proposito: string;
  folio?: string;
  profesores?: string;
  telefonos?: string;
  correos?: string;
  comprobanteRuta?: string;
  montoPagado?: number;
  titularPago?: string;
  servicios?: string[] | string;
  services?: string[] | string;
}

@Component({
  selector: 'app-monitor-solicitudes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './monitor-solicitudes.html',
  styleUrl: './monitor-solicitudes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonitorSolicitudes implements OnInit {
  private http = inject(HttpClient);

  solicitudes = signal<Solicitud[]>([]);

  filterFecha = signal('');
  filterEstado = signal<'todos' | 'aprobada' | 'pendiente' | 'rechazada' | 'correccion'>('todos');
  filterEscuela = signal<string>('todos');

  solicitudSeleccionada = signal<Solicitud | null>(null);
  mostrarCampoCorreccion = signal(false);
  motivoCorreccion = signal('');

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes() {
    this.http.get<Solicitud[]>('/api/monitor/solicitudes').subscribe({
      next: (data) => this.solicitudes.set(data),
      error: (err) => console.error('Error al cargar el monitor:', err)
    });
  }

  get filteredSolicitudes() {
    return this.solicitudes().filter(s => {
      const matchFecha = !this.filterFecha() || s.fechaVisita === this.filterFecha();
      const matchEstado = this.filterEstado() === 'todos' || s.estado === this.filterEstado();
      const matchEscuela =
        this.filterEscuela() === 'todos' ||
        (s.escuela || '').toLowerCase() === this.filterEscuela().toLowerCase();

      return matchFecha && matchEstado && matchEscuela;
    });
  }

  onFilterFecha(value: string) { this.filterFecha.set(value); }
  onFilterEstado(value: 'todos' | 'aprobada' | 'pendiente' | 'rechazada' | 'correccion') { this.filterEstado.set(value); }
  onFilterEscuela(value: string) { this.filterEscuela.set(value); }

  exportarPDF() { console.log('Exportar a PDF - Próximamente'); }
  exportarExcel() { console.log('Exportar a Excel - Próximamente'); }
  exportarCSV() { console.log('Exportar a CSV - Próximamente'); }

  get estadisticas() {
    return {
      total: this.filteredSolicitudes.length,
      aprobadas: this.filteredSolicitudes.filter(s => s.estado === 'aprobada').length,
      pendientes: this.filteredSolicitudes.filter(s => s.estado === 'pendiente' || s.estado === 'correccion').length,
      rechazadas: this.filteredSolicitudes.filter(s => s.estado === 'rechazada').length,
      totalVisitantes: this.filteredSolicitudes.reduce((sum, s) => sum + s.numeroVisitantes, 0)
    };
  }

  abrirDetalle(solicitud: Solicitud) {
    this.solicitudSeleccionada.set(solicitud);
    this.mostrarCampoCorreccion.set(false);
    this.motivoCorreccion.set('');
  }

  cerrarDetalle() {
    this.solicitudSeleccionada.set(null);
  }

  toggleCorreccion() {
    this.mostrarCampoCorreccion.set(!this.mostrarCampoCorreccion());
  }

  cambiarEstado(nuevoEstado: 'aprobada' | 'rechazada' | 'correccion') {
    const solicitud = this.solicitudSeleccionada();
    if (!solicitud) return;

    const payload = {
      estado: nuevoEstado,
      motivo: nuevoEstado === 'correccion' ? this.motivoCorreccion() : null
    };

    this.http.put(`/api/solicitudes/${solicitud.id}/estado-colaborador`, payload).subscribe({
      next: () => {
        const currentList = this.solicitudes();
        const updated: Solicitud[] = currentList.map(sol =>
          sol.id === solicitud.id ? { ...sol, estado: nuevoEstado } : sol
        );
        this.solicitudes.set(updated);
        this.cerrarDetalle();
      },
      error: (err) => console.error('Error al actualizar estado:', err)
    });
  }
}