import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReporteInstalacion {
  id: number;
  zona: string;
  estado: 'operativo' | 'mantenimiento' | 'cerrado';
  descripcion: string;
  fechaReporte: string;
  reportadoPor: string;
}

@Component({
  selector: 'app-colaborador-instalaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './instalaciones.html',
  styleUrl: './instalaciones.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Instalaciones implements OnInit {
  private http = inject(HttpClient);
  
  // El signal ahora inicia vacío, se llenará desde MariaDB
  reportes = signal<ReporteInstalacion[]>([]);

  cantOperativos = computed(() => this.reportes().filter(r => r.estado === 'operativo').length);
  cantMantenimiento = computed(() => this.reportes().filter(r => r.estado === 'mantenimiento').length);
  cantCerrados = computed(() => this.reportes().filter(r => r.estado === 'cerrado').length);

  mostrarModal = signal(false);
  nuevaZona = signal('');
  nuevoEstado = signal<'operativo' | 'mantenimiento' | 'cerrado'>('operativo');
  nuevaDescripcion = signal('');
  guardando = signal(false);
  errorMensaje = signal('');
  estadoActualizando = signal<number | null>(null);

  ngOnInit() {
    this.cargarReportes();
  }

  cargarReportes() {
    this.http.get<ReporteInstalacion[]>('/api/instalaciones').subscribe({
      next: (data) => this.reportes.set(data),
      error: (err) => {
        console.error('Error al cargar la bitácora:', err);
        this.errorMensaje.set('No se pudo cargar la bitácora de instalaciones.');
      }
    });
  }

  abrirModal() {
    this.nuevaZona.set('');
    this.nuevoEstado.set('operativo');
    this.nuevaDescripcion.set('');
    this.errorMensaje.set('');
    this.mostrarModal.set(true);
  }

  cerrarModal() {
    this.mostrarModal.set(false);
  }

  guardarReporte() {
    if (!this.nuevaZona().trim() || !this.nuevaDescripcion().trim() || this.guardando()) {
      this.errorMensaje.set('Completa la zona y la descripción antes de guardar.');
      return;
    }

    const payload = {
      zona: this.nuevaZona().trim(),
      estado: this.nuevoEstado(),
      descripcion: this.nuevaDescripcion().trim(),
      reportadoPor: localStorage.getItem('usuarioNombre') || localStorage.getItem('usuarioCorreo') || 'Colaborador'
    };

    this.guardando.set(true);
    this.http.post('/api/instalaciones', payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cargarReportes();
        this.cerrarModal();
      },
      error: (err) => {
        console.error('Error al guardar reporte:', err);
        this.guardando.set(false);
        this.errorMensaje.set('No se pudo guardar el reporte. Intenta nuevamente.');
      }
    });
  }

  actualizarEstado(reporte: ReporteInstalacion, estado: ReporteInstalacion['estado']): void {
    if (reporte.estado === estado || this.estadoActualizando() !== null) return;
    this.errorMensaje.set('');
    this.estadoActualizando.set(reporte.id);
    this.http.put(`/api/instalaciones/${reporte.id}/estado`, { estado }).subscribe({
      next: () => {
        this.reportes.update(reportes => reportes.map(item =>
          item.id === reporte.id ? { ...item, estado } : item
        ));
        this.estadoActualizando.set(null);
      },
      error: (err) => {
        console.error('Error al actualizar estado de instalación:', err);
        this.estadoActualizando.set(null);
        this.errorMensaje.set('No se pudo actualizar el estado. Intenta nuevamente.');
      }
    });
  }

  descargarSolicitudServicio(reporte: ReporteInstalacion): void {
    const doc = new jsPDF();
    doc.setFillColor(27, 55, 31);
    doc.rect(0, 0, 210, 31, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.text('JARDÍN BOTÁNICO UNIVERSITARIO BUAP', 14, 13);
    doc.setFontSize(12);
    doc.text('SOLICITUD DE SERVICIO', 14, 23);
    doc.setTextColor(35, 55, 40);
    autoTable(doc, {
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [59, 125, 68] },
      head: [['Información del reporte', 'Detalle']],
      body: [
        ['Zona o instalación', reporte.zona],
        ['Estado actual', this.etiquetaEstado(reporte.estado)],
        ['Descripción de la solicitud', reporte.descripcion],
        ['Fecha del reporte', reporte.fechaReporte],
        ['Solicitante', reporte.reportadoPor]
      ],
      styles: { cellPadding: 4, fontSize: 10 },
      columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold' } }
    });
    let finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 25;
    if (finalY > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      finalY = 35;
    }
    doc.setDrawColor(80, 110, 82);
    doc.line(18, finalY, 88, finalY);
    doc.line(122, finalY, 192, finalY);
    doc.setFontSize(9);
    doc.text('Solicitante', 53, finalY + 6, { align: 'center' });
    doc.text('Autorización', 157, finalY + 6, { align: 'center' });
    doc.save(`Solicitud_Servicio_${reporte.id || 'borrador'}.pdf`);
  }

  descargarSolicitudActual(): void {
    if (!this.nuevaZona().trim() || !this.nuevaDescripcion().trim()) {
      this.errorMensaje.set('Completa la zona y la descripción para generar el formato.');
      return;
    }

    this.descargarSolicitudServicio({
      id: 0,
      zona: this.nuevaZona().trim(),
      estado: this.nuevoEstado(),
      descripcion: this.nuevaDescripcion().trim(),
      fechaReporte: new Date().toLocaleDateString('es-MX'),
      reportadoPor: localStorage.getItem('usuarioNombre') || localStorage.getItem('usuarioCorreo') || 'Colaborador'
    });
  }

  etiquetaEstado(estado: ReporteInstalacion['estado']): string {
    return { operativo: 'Operativo', mantenimiento: 'Mantenimiento', cerrado: 'Cerrado' }[estado];
  }
}