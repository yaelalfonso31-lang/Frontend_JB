import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// 1. Importa el componente del modal y su interfaz
// Asegúrate de que la ruta coincida con donde lo generaste
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
  // 2. Agrega ModalCorreccionComponent al array de imports
  imports: [CommonModule, FormsModule, ModalCorreccionComponent],
  templateUrl: './consultar-solicitud.html',
  styleUrls: ['./consultar-solicitud.scss']
})
export class ConsultarSolicitudComponent {
  folio: string = '';
  correo: string = '';
  busquedaRealizada: boolean = false;
  solicitudEncontrada: SolicitudVisita | null = null;
  mensajeExito: boolean = false;

  // --- VARIABLES PARA EL MODAL ---
  mostrarModalCorreccion: boolean = false;
  camposACorregir: CampoCorreccion[] = [];

  buscarSolicitud(): void {
    this.busquedaRealizada = true;
    this.mensajeExito = false;

    // Cambia el estado a 'Requiere Corrección' para que aparezca el botón
    if (this.folio === 'JB-2026-1234' && this.correo === 'test@buap.mx') {
      this.solicitudEncontrada = {
        folio: 'JB-2026-1234',
        correo: 'test@buap.mx',
        servicio: 'Recorrido Guiado Escolar',
        fecha: '2026-09-15T10:00:00',
        asistentes: 25,
        estado: 'Requiere Corrección',
        mensajeCorreccion: 'Existen detalles en tu solicitud que requieren atención.'
      };
    } else {
      this.solicitudEncontrada = null;
    }
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

  // --- LÓGICA DEL MODAL ---

  // 3. Método para preparar los datos y mostrar el modal
  abrirModalCorreccion(): void {
    // Al integrarlo con tu API, estos datos llegarán desde el backend del Jardín Botánico
    this.camposACorregir = [
      {
        id: 'asistentes',
        etiqueta: 'Número de visitantes',
        tipo: 'number',
        valorActual: this.solicitudEncontrada?.asistentes,
        mensajeError: 'Para los recorridos guiados el máximo permitido por guía es de 20 personas.'
      },
      {
        id: 'oficioEscolar',
        etiqueta: 'Oficio de visita escolar (Reemplazar archivo)',
        tipo: 'file',
        valorActual: '',
        mensajeError: 'El documento adjunto no cuenta con el sello oficial de la dirección de tu facultad.'
      }
    ];
    this.mostrarModalCorreccion = true;
  }

  // 4. Método para recibir las correcciones y enviarlas al backend
  procesarCorreccion(datosActualizados: any): void {
    console.log('Datos listos para enviar al backend:', datosActualizados);

    // Aquí realizarás el HTTP POST/PUT hacia la base de datos

    // Para probar visualmente:
    alert('Correcciones guardadas con éxito.');
    this.mostrarModalCorreccion = false;

    // Reflejar localmente el cambio en la vista
    if (this.solicitudEncontrada) {
      this.solicitudEncontrada.estado = 'En Revisión';
      this.solicitudEncontrada.mensajeCorreccion = '';
      if (datosActualizados.asistentes) {
        this.solicitudEncontrada.asistentes = datosActualizados.asistentes;
        this.mensajeExito = true;
      }
    }
  }

  regresarInicio(): void {
    // Redirige al usuario a la página de inicio
    window.location.href = '/inicio';
  }
}