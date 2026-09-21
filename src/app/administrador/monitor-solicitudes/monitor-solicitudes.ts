import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  solicitudes = signal<Solicitud[]>([
    {
      id: 101,
      solicitante: 'Ana García',
      escuela: 'Primaria',
      fechaVisita: '2026-09-25',
      estado: 'pendiente',
      numeroVisitantes: 18,
      proposito: 'Visita guiada de ciencias naturales'
    },
    {
      id: 102,
      solicitante: 'Miguel Torres',
      escuela: 'Secundaria',
      fechaVisita: '2026-09-26',
      estado: 'aprobada',
      numeroVisitantes: 24,
      proposito: 'Recorrido educativo del jardín botánico'
    },
    {
      id: 103,
      solicitante: 'Carla Soto',
      escuela: 'Técnica',
      fechaVisita: '2026-09-27',
      estado: 'rechazada',
      numeroVisitantes: 12,
      proposito: 'Taller de biología aplicada'
    }
  ]);

  filterFecha = signal('');
  filterEstado = signal<'todos' | 'aprobada' | 'pendiente' | 'rechazada'>('todos');
  filterEscuela = signal<'todos' | 'Primaria' | 'Secundaria' | 'Técnica'>('todos');
  checklistSeleccionada = signal<Solicitud | null>(null);

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.http.get<Solicitud[]>('/api/monitor/solicitudes').subscribe({
      next: (data) => this.solicitudes.set(data.length ? data : this.solicitudes()),
      error: (error) => console.error('Error al cargar el monitor:', error)
    });
  }

  get filteredSolicitudes(): Solicitud[] {
    return this.solicitudes().filter((solicitud) => {
      const matchFecha = !this.filterFecha() || solicitud.fechaVisita === this.filterFecha();
      const matchEstado = this.filterEstado() === 'todos' || solicitud.estado === this.filterEstado();
      const matchEscuela = this.filterEscuela() === 'todos' || solicitud.escuela === this.filterEscuela();
      return matchFecha && matchEstado && matchEscuela;
    });
  }

  onFilterFecha(value: string): void {
    this.filterFecha.set(value);
  }

  onFilterEstado(value: 'todos' | 'aprobada' | 'pendiente' | 'rechazada'): void {
    this.filterEstado.set(value);
  }

  onFilterEscuela(value: 'todos' | 'Primaria' | 'Secundaria' | 'Técnica'): void {
    this.filterEscuela.set(value);
  }

  limpiarFiltros(): void {
    this.filterFecha.set('');
    this.filterEstado.set('todos');
    this.filterEscuela.set('todos');
  }

  abrirChecklist(solicitud: Solicitud): void {
    this.checklistSeleccionada.set(solicitud);
  }

  cerrarChecklist(): void {
    this.checklistSeleccionada.set(null);
  }

  cambiarEstado(nuevoEstado: 'aprobada' | 'pendiente' | 'rechazada'): void {
    const solicitudActual = this.checklistSeleccionada();
    if (!solicitudActual) return;

    this.solicitudes.set(this.solicitudes().map((solicitud) =>
      solicitud.id === solicitudActual.id ? { ...solicitud, estado: nuevoEstado } : solicitud
    ));
    this.cerrarChecklist();
  }

  exportarPDF(): void {
    const rows = this.filteredSolicitudes.map((solicitud) => [
      solicitud.id, solicitud.solicitante, solicitud.escuela,
      solicitud.fechaVisita, solicitud.numeroVisitantes, solicitud.estado
    ]);
    const doc = new jsPDF();
    doc.text('Solicitudes de visitas', 14, 15);
    autoTable(doc, {
      head: [['#', 'Solicitante', 'Escuela', 'Fecha', 'Visitantes', 'Estado']],
      body: rows,
      startY: 22,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [16, 124, 94] }
    });
    doc.save('solicitudes.pdf');
  }

  exportarExcel(): void {
    const headers = ['#', 'Solicitante', 'Escuela', 'Fecha', 'Visitantes', 'Estado'];
    const rows = this.filteredSolicitudes.map((solicitud) => [
      solicitud.id, solicitud.solicitante, solicitud.escuela,
      solicitud.fechaVisita, solicitud.numeroVisitantes, solicitud.estado
    ]);
    this.descargarArchivo(
      [headers, ...rows].map((row) => row.join(',')).join('\n'),
      'solicitudes.xls',
      'application/vnd.ms-excel;charset=utf-8'
    );
  }

  exportarCSV(): void {
    const headers = ['#', 'Solicitante', 'Escuela', 'Fecha', 'Visitantes', 'Estado'];
    const rows = this.filteredSolicitudes.map((solicitud) => [
      solicitud.id, solicitud.solicitante, solicitud.escuela,
      solicitud.fechaVisita, solicitud.numeroVisitantes, solicitud.estado
    ]);
    const contenido = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    this.descargarArchivo(contenido, 'solicitudes.csv', 'text/csv;charset=utf-8;');
  }

  private descargarArchivo(contenido: string, nombre: string, tipo: string): void {
    const blob = new Blob([contenido], { type: tipo });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombre;
    link.click();
    URL.revokeObjectURL(url);
  }

  get estadisticas() {
    return {
      total: this.filteredSolicitudes.length,
      aprobadas: this.filteredSolicitudes.filter((solicitud) => solicitud.estado === 'aprobada').length,
      pendientes: this.filteredSolicitudes.filter((solicitud) => solicitud.estado === 'pendiente').length,
      rechazadas: this.filteredSolicitudes.filter((solicitud) => solicitud.estado === 'rechazada').length,
      totalVisitantes: this.filteredSolicitudes.reduce((total, solicitud) => total + solicitud.numeroVisitantes, 0)
    };
  }
}
