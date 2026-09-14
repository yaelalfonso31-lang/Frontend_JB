import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Solicitud {
  id: number;
  solicitante: string;
  escuela: string;
  fechaVisita: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  numeroVisitantes: number;
  proposito: string;
}

@Component({
  selector: 'app-monitor-solicitudes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './monitor-solicitudes.html',
  styleUrl: './monitor-solicitudes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonitorSolicitudesComponent implements OnInit {
  private http = inject(HttpClient);

  // Inicializamos el signal vacío
  solicitudes = signal<Solicitud[]>([]);

  filterFecha = signal('');
  filterEstado = signal<'todos' | 'aprobada' | 'pendiente' | 'rechazada'>('todos');
  filterEscuela = signal<string>('todos'); // Cambiado a string genérico por si la BD trae "Universidad" o "Preescolar"

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
      const matchEscuela = this.filterEscuela() === 'todos' || s.escuela === this.filterEscuela();

      return matchFecha && matchEstado && matchEscuela;
    });
  }

  onFilterFecha(value: string) {
    this.filterFecha.set(value);
  }

  onFilterEstado(value: 'todos' | 'aprobada' | 'pendiente' | 'rechazada') {
    this.filterEstado.set(value);
  }

  onFilterEscuela(value: string) {
    this.filterEscuela.set(value);
  }

  exportarPDF() {
    console.log('Exportar a PDF - Próximamente');
  }

  exportarExcel() {
    console.log('Exportar a Excel - Próximamente');
  }

  exportarCSV() {
    console.log('Exportar a CSV - Próximamente');
  }

  get estadisticas() {
    return {
      total: this.filteredSolicitudes.length,
      aprobadas: this.filteredSolicitudes.filter(s => s.estado === 'aprobada').length,
      pendientes: this.filteredSolicitudes.filter(s => s.estado === 'pendiente').length,
      rechazadas: this.filteredSolicitudes.filter(s => s.estado === 'rechazada').length,
      totalVisitantes: this.filteredSolicitudes.reduce((sum, s) => sum + s.numeroVisitantes, 0)
    };
  }
}