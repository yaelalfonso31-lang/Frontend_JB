import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { ChecklistRegistryService } from '../checklists/checklist-registry.service';
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
  horaVisita?: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'correccion';
  comentarioEstado?: string;
  mensajeCorreccion?: string;
  mensajeRechazo?: string;
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
  motivoCorreccion = signal('');
  errorComentario = signal('');

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  private checklistRegistry = inject(ChecklistRegistryService);

  cargarSolicitudes() {
    this.http.get<Solicitud[]>('/api/monitor/solicitudes').subscribe({
      next: (data) => {
        this.solicitudes.set(data);
        for (const sol of data) {
          const rawServices = sol.servicios ?? sol.services ?? [];
          const servicios = Array.isArray(rawServices)
            ? rawServices
            : String(rawServices).split(',').map(s => s.trim()).filter(Boolean);

          if (sol.folio && servicios.length) {
            this.checklistRegistry.registerSubmittedRequest({
              folio: sol.folio,
              school: sol.solicitante || sol.escuela,
              date: sol.fechaVisita,
              services: servicios,
              status: sol.estado
            });
          }
        }
      },
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

  exportarPDF(): void {
    const rows = this.filteredSolicitudes.map((s) => [
      s.id, s.solicitante, s.escuela, s.fechaVisita, s.numeroVisitantes, s.estado
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
    doc.save('solicitudes_colaborador.pdf');
  }

  exportarExcel(): void {
    const headers = ['#', 'Solicitante', 'Escuela', 'Fecha', 'Visitantes', 'Estado'];
    const rows = this.filteredSolicitudes.map((s) => [
      s.id, s.solicitante, s.escuela, s.fechaVisita, s.numeroVisitantes, s.estado
    ]);
    this.descargarArchivo(
      [headers, ...rows].map((row) => row.join(',')).join('\n'),
      'solicitudes_colaborador.xls',
      'application/vnd.ms-excel;charset=utf-8'
    );
  }

  exportarCSV(): void {
    const headers = ['#', 'Solicitante', 'Escuela', 'Fecha', 'Visitantes', 'Estado'];
    const rows = this.filteredSolicitudes.map((s) => [
      s.id, s.solicitante, s.escuela, s.fechaVisita, s.numeroVisitantes, s.estado
    ]);
    const contenido = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    this.descargarArchivo(contenido, 'solicitudes_colaborador.csv', 'text/csv;charset=utf-8;');
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
      aprobadas: this.filteredSolicitudes.filter(s => s.estado === 'aprobada').length,
      pendientes: this.filteredSolicitudes.filter(s => s.estado === 'pendiente' || s.estado === 'correccion').length,
      rechazadas: this.filteredSolicitudes.filter(s => s.estado === 'rechazada').length,
      totalVisitantes: this.filteredSolicitudes.reduce((sum, s) => sum + s.numeroVisitantes, 0)
    };
  }

  abrirDetalle(solicitud: Solicitud) {
    this.solicitudSeleccionada.set(solicitud);
    this.motivoCorreccion.set('');
    this.errorComentario.set('');
  }

  cerrarDetalle() {
    this.solicitudSeleccionada.set(null);
    this.motivoCorreccion.set('');
    this.errorComentario.set('');
  }

  cambiarEstado(nuevoEstado: 'aprobada' | 'rechazada' | 'correccion') {
    const solicitud = this.solicitudSeleccionada();
    if (!solicitud) return;

    const comentario = this.motivoCorreccion().trim();
    if (!comentario) {
      this.errorComentario.set('Escribe un comentario para informar a la persona solicitante.');
      return;
    }

    const payload = {
      estado: nuevoEstado,
      motivo: comentario
    };

    this.http.put(`/api/solicitudes/${solicitud.id}/estado-colaborador`, payload).subscribe({
      next: () => {
        const currentList = this.solicitudes();
        const updated: Solicitud[] = currentList.map(sol =>
          sol.id === solicitud.id
            ? {
                ...sol,
                estado: nuevoEstado,
                comentarioEstado: comentario,
                mensajeCorreccion: nuevoEstado === 'correccion' ? comentario : sol.mensajeCorreccion,
                mensajeRechazo: nuevoEstado === 'rechazada' ? comentario : sol.mensajeRechazo
              }
            : sol
        );
        this.solicitudes.set(updated);
        const services = this.servicesFor(solicitud);
        if (solicitud.folio && services.length) {
          this.checklistRegistry.registerSubmittedRequest({
            folio: solicitud.folio,
            school: solicitud.solicitante || solicitud.escuela,
            date: solicitud.fechaVisita,
            services,
            status: nuevoEstado
          });
        }
        this.cerrarDetalle();
      },
      error: (err) => {
        console.error('Error al actualizar estado:', err);
        this.errorComentario.set('No se pudo actualizar la solicitud. Intenta nuevamente.');
      }
    });
  }

  private servicesFor(solicitud: Solicitud): string[] {
    const rawServices = solicitud.servicios ?? solicitud.services ?? [];
    return Array.isArray(rawServices)
      ? rawServices
      : String(rawServices).split(',').map(service => service.trim()).filter(Boolean);
  }
}