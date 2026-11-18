import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ModalCorreccionComponent, CampoCorreccion } from '../modal-correccion/modal-correccion';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';
import { RouterOutlet } from '@angular/router';

export interface SolicitudVisita {
  id?: number;
  folio: string;
  correo: string;
  servicio: string;
  fecha: string;
  hora_visita?: string;
  horaVisita?: string;
  asistentes: number;
  nombre_escuela?: string;
  solicitante?: string;
  nivel_educativo?: string;
  escuela?: string;
  proposito?: string;
  profesores?: string;
  telefonos?: string;
  correos?: string;
  titular_pago?: string;
  titularPago?: string;
  monto_pagado?: number;
  montoPagado?: number;
  estado: 'Pendiente' | 'En Revisión' | 'Aprobada' | 'Rechazada' | 'Requiere Corrección' | 'Correccion' | 'correccion' | string;
  mensajeCorreccion?: string;
  mensajeRechazo?: string;
  comentarioEstado?: string;
  comentario?: string;
  motivo?: string;
  camposCorregir?: string[];
  campos_corregir?: string[];
}

@Component({
  selector: 'app-consultar-solicitud',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalCorreccionComponent, HeaderComponent, FooterComponent, RouterOutlet],
  templateUrl: './consultar-solicitud.html',
  styleUrls: ['./consultar-solicitud.scss']
})
export class ConsultarSolicitudComponent {
  private http = inject(HttpClient);

  folio: string = '';
  correo: string = '';
  busquedaRealizada: boolean = false;
  solicitudEncontrada: SolicitudVisita | null = null;
  mensajeExito: boolean = false;

  mostrarModalCorreccion: boolean = false;
  camposACorregir: CampoCorreccion[] = [];

  readonly etiquetasCampos: Record<string, string> = {
    nombre_escuela: 'Nombre de la escuela / institución',
    nivel_educativo: 'Nivel educativo',
    fecha: 'Fecha de visita',
    fecha_visita: 'Fecha de visita',
    hora_visita: 'Hora de visita',
    asistentes: 'Número de visitantes',
    numero_visitantes: 'Número de visitantes',
    proposito: 'Propósito / Servicios',
    profesores: 'Profesor(es) responsable(s)',
    telefonos: 'Teléfono(s) de contacto',
    correos: 'Correo(s) electrónico(s)',
    titular_pago: 'Titular del pago',
    monto_pagado: 'Monto pagado',
    comprobante: 'Comprobante de pago'
  };

  buscarSolicitud(): void {
    this.busquedaRealizada = true;
    this.mensajeExito = false;
    this.solicitudEncontrada = null;

    this.http.get<SolicitudVisita>(`/api/solicitudes/${this.folio.trim()}?correo=${this.correo.trim()}`)
      .subscribe({
        next: (datosBD) => {
          console.log('¡Solicitud encontrada en la Base de Datos!', datosBD);
          this.solicitudEncontrada = datosBD;
        },
        error: (err) => {
          console.error('Error o solicitud no encontrada:', err);
          this.solicitudEncontrada = null;
        }
      });
  }

  esEstadoCorreccion(estado?: string): boolean {
    const limpio = (estado || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    return limpio === 'correccion' || limpio === 'requiere correccion';
  }

  esEstadoAprobada(estado?: string): boolean {
    return (estado || '').toLowerCase().trim() === 'aprobada';
  }

  esEstadoRechazada(estado?: string): boolean {
    return (estado || '').toLowerCase().trim() === 'rechazada';
  }

  obtenerEtiquetaEstado(estado?: string): string {
    if (this.esEstadoCorreccion(estado)) return 'Requiere Corrección';
    if (this.esEstadoAprobada(estado)) return 'Aprobada';
    if (this.esEstadoRechazada(estado)) return 'Rechazada';
    return estado || 'Pendiente';
  }

  obtenerClaseEstado(estado: string): string {
    if (this.esEstadoCorreccion(estado)) return 'badge-correccion';
    if (this.esEstadoAprobada(estado)) return 'badge-aprobada';
    if (this.esEstadoRechazada(estado)) return 'badge-rechazada';

    const mapaClases: { [key: string]: string } = {
      'Pendiente': 'badge-pendiente',
      'pendiente': 'badge-pendiente',
      'En Revisión': 'badge-revision'
    };
    return mapaClases[estado] || 'badge-default';
  }

  obtenerMensajeRevision(): string {
    if (!this.solicitudEncontrada) return '';
    return (
      this.solicitudEncontrada.mensajeCorreccion ||
      this.solicitudEncontrada.comentarioEstado ||
      this.solicitudEncontrada.comentario ||
      this.solicitudEncontrada.motivo ||
      ''
    );
  }

  obtenerCamposSolicitados(): string[] {
    if (!this.solicitudEncontrada) return [];
    return this.solicitudEncontrada.camposCorregir ?? this.solicitudEncontrada.campos_corregir ?? [];
  }

  abrirModalCorreccion(): void {
    if (!this.solicitudEncontrada) return;

    const sol = this.solicitudEncontrada;
    const seleccionados = this.obtenerCamposSolicitados();
    const instruccion = this.obtenerMensajeRevision() || 'Verifica y corrige este dato.';

    const mapaConfiguracion: Record<string, { tipo: 'text' | 'number' | 'file' | 'textarea'; valor: any }> = {
      nombre_escuela: { tipo: 'text', valor: sol.nombre_escuela || sol.solicitante || '' },
      nivel_educativo: { tipo: 'text', valor: sol.nivel_educativo || sol.escuela || '' },
      fecha: { tipo: 'text', valor: sol.fecha || '' },
      fecha_visita: { tipo: 'text', valor: sol.fecha || '' },
      hora_visita: { tipo: 'text', valor: sol.hora_visita || sol.horaVisita || '' },
      asistentes: { tipo: 'number', valor: sol.asistentes },
      numero_visitantes: { tipo: 'number', valor: sol.asistentes },
      proposito: { tipo: 'textarea', valor: sol.proposito || sol.servicio || '' },
      profesores: { tipo: 'text', valor: sol.profesores || '' },
      telefonos: { tipo: 'text', valor: sol.telefonos || '' },
      correos: { tipo: 'text', valor: sol.correos || sol.correo || '' },
      titular_pago: { tipo: 'text', valor: sol.titular_pago || sol.titularPago || '' },
      monto_pagado: { tipo: 'number', valor: sol.monto_pagado ?? sol.montoPagado ?? 0 },
      comprobante: { tipo: 'file', valor: null }
    };

    if (seleccionados.length > 0) {
      this.camposACorregir = seleccionados.map((key) => {
        const config = mapaConfiguracion[key] || { tipo: 'text', valor: (sol as any)[key] ?? '' };
        return {
          id: key,
          etiqueta: this.etiquetasCampos[key] || key,
          tipo: config.tipo,
          valorActual: config.valor,
          mensajeError: instruccion
        };
      });
    } else {
      // Si la solicitud fue marcada en corrección sin especificar campos individuales
      this.camposACorregir = [
        {
          id: 'asistentes',
          etiqueta: 'Número de visitantes',
          tipo: 'number',
          valorActual: sol.asistentes,
          mensajeError: instruccion
        }
      ];
    }

    this.mostrarModalCorreccion = true;
  }

  procesarCorreccion(datosActualizados: Record<string, any>): void {
    if (!this.solicitudEncontrada) return;

    const formData = new FormData();
    Object.entries(datosActualizados).forEach(([key, valor]) => {
      if (valor !== undefined && valor !== null) {
        if (valor instanceof File) {
          formData.append(key, valor, valor.name);
        } else {
          formData.append(key, String(valor));
        }
      }
    });

    this.http.put(`/api/solicitudes/${this.solicitudEncontrada.folio}/correccion`, formData).subscribe({
      next: () => {
        this.mostrarModalCorreccion = false;
        if (this.solicitudEncontrada) {
          this.solicitudEncontrada.estado = 'Pendiente';
          this.solicitudEncontrada.camposCorregir = [];
          this.solicitudEncontrada.campos_corregir = [];
          this.mensajeExito = true;
        }
      },
      error: (err) => {
        console.error('Error al enviar corrección:', err);
        alert('No se pudo enviar la corrección. Intenta nuevamente.');
      }
    });
  }

  regresarInicio(): void {
    window.location.href = '/inicio';
  }
}