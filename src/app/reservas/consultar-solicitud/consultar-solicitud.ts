import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ModalCorreccionComponent, CampoCorreccion } from '../modal-correccion/modal-correccion';

export interface SolicitudVisita {
  folio: string;
  correo: string;
  servicio: string;
  fecha: string;
  asistentes: number;
  estado: 'Pendiente' | 'En Revisión' | 'Aprobada' | 'Rechazada' | 'Requiere Corrección';
  mensajeCorreccion?: string;
  mensajeRechazo?: string;
}

@Component({
  selector: 'app-consultar-solicitud',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalCorreccionComponent],
  templateUrl: './consultar-solicitud.html',
  styleUrls: ['./consultar-solicitud.scss']
})
export class ConsultarSolicitudComponent {
  private http = inject(HttpClient); // <--- Inyectamos el cliente para hacer peticiones

  folio: string = '';
  correo: string = '';
  busquedaRealizada: boolean = false;
  solicitudEncontrada: SolicitudVisita | null = null;
  mensajeExito: boolean = false;

  mostrarModalCorreccion: boolean = false;
  camposACorregir: CampoCorreccion[] = [];

  buscarSolicitud(): void {
    this.busquedaRealizada = true;
    this.mensajeExito = false;
    this.solicitudEncontrada = null; // Reiniciamos la vista

    // --- LLAMADA REAL A TU SERVIDOR ---
    this.http.get<SolicitudVisita>(`/api/solicitudes/${this.folio}?correo=${this.correo}`)
      .subscribe({
        next: (datosBD) => {
          console.log('¡Solicitud encontrada en la Base de Datos!', datosBD);
          this.solicitudEncontrada = datosBD;
        },
        error: (err) => {
          console.error('Error o solicitud no encontrada:', err);
          this.solicitudEncontrada = null; // Esto activará la alerta roja de "No encontramos ninguna solicitud"
        }
      });
  }

  obtenerClaseEstado(estado: string): string {
    const mapaClases: { [key: string]: string } = {
      'Pendiente': 'badge-pendiente',
      'En Revisión': 'badge-revision',
      'Aprobada': 'badge-aprobada',
      'Rechazada': 'badge-rechazada',
      'Requiere Corrección': 'badge-correccion'
    };
    return mapaClases[estado] || 'badge-default';
  }

  abrirModalCorreccion(): void {
    this.camposACorregir = [
      {
        id: 'asistentes',
        etiqueta: 'Número de visitantes',
        tipo: 'number',
        valorActual: this.solicitudEncontrada?.asistentes,
        mensajeError: 'Verifique su capacidad máxima.'
      }
    ];
    this.mostrarModalCorreccion = true;
  }

  procesarCorreccion(datosActualizados: any): void {
    alert('Correcciones guardadas con éxito (Modo Visual).');
    this.mostrarModalCorreccion = false;
    if (this.solicitudEncontrada) {
      this.solicitudEncontrada.estado = 'En Revisión';
      this.mensajeExito = true;
    }
  }

  regresarInicio(): void {
    window.location.href = '/inicio';
  }
}