import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface SolicitudColaborador {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  razonSocial?: string;
  experiencia: string;
  fechaSolicitud: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
}

@Component({
  selector: 'app-aprobacion-colaboradores',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aprobacion-colaboradores.html',
  styleUrl: './aprobacion-colaboradores.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AprobacionColaboradoresComponent implements OnInit {
  private http = inject(HttpClient);
  
  // Inicializamos el signal vacío
  solicitudes = signal<SolicitudColaborador[]>([]);
  selectedSolicitud = signal<SolicitudColaborador | null>(null);

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.http.get<SolicitudColaborador[]>('/api/colaboradores/solicitudes').subscribe({
      next: (data) => this.solicitudes.set(data),
      error: (err) => console.error('Error al cargar solicitudes', err)
    });
  }

  selectSolicitud(solicitud: SolicitudColaborador) {
    this.selectedSolicitud.set(solicitud);
  }

  closeDetail() {
    this.selectedSolicitud.set(null);
  }

  cambiarEstado(id: number, nuevoEstado: 'aprobado' | 'rechazado') {
    this.http.put(`/api/colaboradores/solicitudes/${id}/estado`, { estado: nuevoEstado }).subscribe({
      next: () => {
        // Actualizamos el estado localmente para no tener que recargar toda la tabla
        const current = this.solicitudes();
        this.solicitudes.set(
          current.map(s => (s.id === id ? { ...s, estado: nuevoEstado } : s))
        );
        this.closeDetail();
      },
      error: (err) => console.error(`Error al cambiar estado a ${nuevoEstado}`, err)
    });
  }

  aprobarSolicitud(id: number) {
    this.cambiarEstado(id, 'aprobado');
  }

  rechazarSolicitud(id: number) {
    this.cambiarEstado(id, 'rechazado');
  }

  get solicitudesPendientes() {
    return this.solicitudes().filter(s => s.estado === 'pendiente');
  }

  get solicitudesAprobadas() {
    return this.solicitudes().filter(s => s.estado === 'aprobado');
  }

  get solicitudesRechazadas() {
    return this.solicitudes().filter(s => s.estado === 'rechazado');
  }
}