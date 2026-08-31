import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

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
export class AprobacionColaboradoresComponent {
  solicitudes = signal<SolicitudColaborador[]>([
    {
      id: 1,
      nombre: 'Roberto Martínez',
      email: 'roberto@example.com',
      telefono: '3005551234',
      razonSocial: 'ONG Amigos',
      experiencia: 'Coordinador de proyectos con 5 años de experiencia',
      fechaSolicitud: '2024-08-28',
      estado: 'pendiente'
    },
    {
      id: 2,
      nombre: 'Daniela Rodríguez',
      email: 'daniela@example.com',
      telefono: '3005555678',
      razonSocial: 'Fundación Educativa',
      experiencia: 'Especialista en educación infantil',
      fechaSolicitud: '2024-08-27',
      estado: 'pendiente'
    },
    {
      id: 3,
      nombre: 'Felipe González',
      email: 'felipe@example.com',
      telefono: '3005559999',
      razonSocial: 'Centro Comunitario',
      experiencia: 'Trabajador social con certificación',
      fechaSolicitud: '2024-08-26',
      estado: 'pendiente'
    }
  ]);

  selectedSolicitud = signal<SolicitudColaborador | null>(null);

  selectSolicitud(solicitud: SolicitudColaborador) {
    this.selectedSolicitud.set(solicitud);
  }

  closeDetail() {
    this.selectedSolicitud.set(null);
  }

  aprobarSolicitud(id: number) {
    const current = this.solicitudes();
    this.solicitudes.set(
      current.map(s => (s.id === id ? { ...s, estado: 'aprobado' } : s))
    );
    this.closeDetail();
  }

  rechazarSolicitud(id: number) {
    const current = this.solicitudes();
    this.solicitudes.set(
      current.map(s => (s.id === id ? { ...s, estado: 'rechazado' } : s))
    );
    this.closeDetail();
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
