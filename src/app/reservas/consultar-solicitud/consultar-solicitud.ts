import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ModalCorreccionComponent, CampoCorreccion } from '../modal-correccion/modal-correccion';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

export interface SolicitudVisitaDetalle {
  folio: string;
  correo: string;
  nombre_escuela: string;
  nivel_educativo: string;
  grado?: string;
  servicio: string;
  proposito: string;
  fecha: string;
  fecha_visita: string;
  hora_visita: string;
  asistentes: number;
  profesores: string;
  telefonos: string;
  correos: string;
  titular_pago: string;
  monto_pagado: number;
  comprobante_ruta?: string;
  estado: 'Pendiente' | 'En Revisión' | 'Aprobada' | 'Rechazada' | 'Requiere Corrección';
  mensajeCorreccion?: string;
  mensajeRechazo?: string;
  camposCorregir?: string[];
}

@Component({
  selector: 'app-consultar-solicitud',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalCorreccionComponent, HeaderComponent, FooterComponent],
  templateUrl: './consultar-solicitud.html',
  styleUrls: ['./consultar-solicitud.scss']
})
export class ConsultarSolicitudComponent {
  private http = inject(HttpClient);
  private router = inject(Router);

  folio: string = '';
  correo: string = '';
  buscando = signal(false);
  busquedaRealizada: boolean = false;
  solicitudEncontrada: SolicitudVisitaDetalle | null = null;
  mensajeExito: boolean = false;

  mostrarModalCorreccion: boolean = false;
  camposACorregir: CampoCorreccion[] = [];

  private readonly catalogoCampos: Record<string, Omit<CampoCorreccion, 'valorActual'>> = {
    nombre_escuela: {
      id: 'nombre_escuela',
      etiqueta: 'Nombre de la escuela / institución',
      tipo: 'text',
      mensajeError: 'Verifica el nombre oficial de la institución educativa.'
    },
    nivel_educativo: {
      id: 'nivel_educativo',
      etiqueta: 'Nivel educativo',
      tipo: 'select',
      mensajeError: 'Selecciona el nivel escolar correspondiente.',
      opciones: [
        { valor: 'prescolar', texto: 'Preescolar' },
        { valor: 'primaria', texto: 'Primaria' },
        { valor: 'secundaria', texto: 'Secundaria' },
        { valor: 'preparatoria', texto: 'Preparatoria' },
        { valor: 'licenciatura', texto: 'Licenciatura' },
        { valor: 'otro', texto: 'Otro' }
      ]
    },
    fecha: {
      id: 'fecha',
      etiqueta: 'Fecha de visita',
      tipo: 'date',
      mensajeError: 'Selecciona una nueva fecha hábil disponible (Lunes a Viernes).'
    },
    hora_visita: {
      id: 'hora_visita',
      etiqueta: 'Horario de visita (09:00 - 15:00)',
      tipo: 'time',
      mensajeError: 'Indica un horario dentro del rango de atención (09:00 a 15:00 hrs).'
    },
    asistentes: {
      id: 'asistentes',
      etiqueta: 'Número total de visitantes',
      tipo: 'number',
      mensajeError: 'Ajusta el número total de asistentes.'
    },
    proposito: {
      id: 'proposito',
      etiqueta: 'Propósito / Notas de la visita',
      tipo: 'textarea',
      mensajeError: 'Detalla o corrige el propósito y observaciones de la visita.'
    },
    profesores: {
      id: 'profesores',
      etiqueta: 'Profesor(es) responsable(s)',
      tipo: 'text',
      placeholder: 'Si son varios, sepáralos por coma',
      mensajeError: 'Verifica el nombre completo del profesor o profesores responsables.'
    },
    telefonos: {
      id: 'telefonos',
      etiqueta: 'Teléfono(s) de contacto (10 dígitos)',
      tipo: 'text',
      placeholder: 'Ej. 2221234567',
      mensajeError: 'Proporciona un número telefónico válido de 10 dígitos.'
    },
    correos: {
      id: 'correos',
      etiqueta: 'Correo(s) electrónico(s)',
      tipo: 'text',
      placeholder: 'ejemplo@correo.com',
      mensajeError: 'Verifica que el correo electrónico esté bien escrito.'
    },
    titular_pago: {
      id: 'titular_pago',
      etiqueta: 'Titular del pago / Institución',
      tipo: 'text',
      mensajeError: 'Verifica el nombre del titular registrado en el comprobante.'
    },
    monto_pagado: {
      id: 'monto_pagado',
      etiqueta: 'Monto pagado (MXN)',
      tipo: 'number',
      mensajeError: 'Verifica que el monto coincida con tu ficha de depósito o transferencia.'
    },
    comprobante: {
      id: 'comprobante',
      etiqueta: 'Comprobante de pago (PDF, JPG o PNG)',
      tipo: 'file',
      mensajeError: 'Adjunta nuevamente un comprobante legible y vigente.'
    }
  };

  buscarSolicitud(): void {
    const folioLimpio = this.folio.trim();
    const correoLimpio = this.correo.trim();
    if (!folioLimpio || !correoLimpio) return;

    this.buscando.set(true);
    this.busquedaRealizada = false;
    this.mensajeExito = false;
    this.solicitudEncontrada = null;

    this.http.get<SolicitudVisitaDetalle>(
      `/api/solicitudes/${encodeURIComponent(folioLimpio)}?correo=${encodeURIComponent(correoLimpio)}`
    ).subscribe({
      next: (datosBD) => {
        this.buscando.set(false);
        this.busquedaRealizada = true;
        this.solicitudEncontrada = datosBD;
      },
      error: (err) => {
        console.error('Error o solicitud no encontrada:', err);
        this.buscando.set(false);
        this.busquedaRealizada = true;
        this.solicitudEncontrada = null;
      }
    });
  }

  obtenerClaseEstado(estado: string): string {
    const mapaClases: Record<string, string> = {
      'Pendiente': 'badge-pendiente',
      'En Revisión': 'badge-revision',
      'Aprobada': 'badge-aprobada',
      'Rechazada': 'badge-rechazada',
      'Requiere Corrección': 'badge-correccion'
    };
    return mapaClases[estado] || 'badge-pendiente';
  }

  etiquetaCampo(key: string): string {
    const normalizada = key === 'fecha_visita' ? 'fecha' : key === 'numero_visitantes' ? 'asistentes' : key;
    return this.catalogoCampos[normalizada]?.etiqueta || key;
  }

  abrirModalCorreccion(): void {
    if (!this.solicitudEncontrada) return;
    const sol = this.solicitudEncontrada;

    const llavesSolicitadas = (sol.camposCorregir && sol.camposCorregir.length > 0)
      ? sol.camposCorregir
      : ['asistentes', 'proposito', 'comprobante'];

    const valoresActuales: Record<string, any> = {
      nombre_escuela: sol.nombre_escuela,
      nivel_educativo: (sol.nivel_educativo || 'primaria').toLowerCase(),
      fecha: sol.fecha_visita || sol.fecha,
      hora_visita: sol.hora_visita,
      asistentes: sol.asistentes,
      proposito: sol.proposito,
      profesores: sol.profesores,
      telefonos: sol.telefonos,
      correos: sol.correos || sol.correo,
      titular_pago: sol.titular_pago,
      monto_pagado: sol.monto_pagado,
      comprobante: null
    };

    this.camposACorregir = llavesSolicitadas
      .map(rawKey => (rawKey === 'fecha_visita' ? 'fecha' : rawKey === 'numero_visitantes' ? 'asistentes' : rawKey))
      .filter(key => !!this.catalogoCampos[key])
      .map(key => ({
        ...this.catalogoCampos[key],
        valorActual: valoresActuales[key]
      }));

    this.mostrarModalCorreccion = true;
  }

  procesarCorreccion(evento: { valores: Record<string, any>; archivo: File | null }): void {
    if (!this.solicitudEncontrada) return;

    const formData = new FormData();
    Object.entries(evento.valores).forEach(([key, val]) => {
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        formData.append(key, String(val).trim());
      }
    });

    if (evento.archivo) {
      formData.append('comprobante', evento.archivo);
    }

    this.http.put(`/api/solicitudes/${encodeURIComponent(this.solicitudEncontrada.folio)}/correccion`, formData)
      .subscribe({
        next: () => {
          this.mostrarModalCorreccion = false;
          this.mensajeExito = true;
          this.buscarSolicitud();
        },
        error: (err) => {
          console.error('Error al enviar corrección:', err);
          alert(err?.error?.detail || 'No se pudo enviar la corrección. Intenta nuevamente.');
        }
      });
  }

  regresarInicio(): void {
    this.router.navigate(['/inicio']);
  }
}