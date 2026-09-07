import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
export class MonitorSolicitudesComponent {
  solicitudes = signal<Solicitud[]>([
    {
      id: 1,
      solicitante: 'Colegio San José',
      escuela: 'Primaria',
      fechaVisita: '2024-09-05',
      estado: 'aprobada',
      numeroVisitantes: 30,
      proposito: 'Actividad educativa'
    },
    {
      id: 2,
      solicitante: 'Centro Educativo Aurora',
      escuela: 'Secundaria',
      fechaVisita: '2024-09-10',
      estado: 'pendiente',
      numeroVisitantes: 45,
      proposito: 'Excursión pedagógica'
    },
    {
      id: 3,
      solicitante: 'Instituto Técnico',
      escuela: 'Técnica',
      fechaVisita: '2024-09-08',
      estado: 'rechazada',
      numeroVisitantes: 25,
      proposito: 'Visita de observación'
    },
    {
      id: 4,
      solicitante: 'Escuela Campestre',
      escuela: 'Primaria',
      fechaVisita: '2024-09-12',
      estado: 'aprobada',
      numeroVisitantes: 35,
      proposito: 'Actividad cultural'
    },
    {
      id: 5,
      solicitante: 'Colegio Adventista',
      escuela: 'Primaria',
      fechaVisita: '2024-09-15',
      estado: 'pendiente',
      numeroVisitantes: 50,
      proposito: 'Programa de integración'
    }
  ]);

  filterFecha = signal('');
  filterEstado = signal<'todos' | 'aprobada' | 'pendiente' | 'rechazada'>('todos');
  filterEscuela = signal<'todos' | 'Primaria' | 'Secundaria' | 'Técnica'>('todos');

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

  onFilterEscuela(value: 'todos' | 'Primaria' | 'Secundaria' | 'Técnica') {
    this.filterEscuela.set(value);
  }

  exportarPDF() {
    console.log('Exportar a PDF');
  }

  exportarExcel() {
    console.log('Exportar a Excel');
  }

  exportarCSV() {
    console.log('Exportar a CSV');
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
