import { Component, EventEmitter, Input, Output, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface CampoCorreccion {
  id: string;
  etiqueta: string;
  tipo: 'text' | 'number' | 'file' | 'textarea' | 'date' | 'time' | 'select';
  valorActual: any;
  mensajeError?: string;
  opciones?: { valor: string; texto: string }[];
  placeholder?: string;
}

@Component({
  selector: 'app-modal-correccion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-correccion.html',
  styleUrls: ['./modal-correccion.scss']
})
export class ModalCorreccionComponent implements OnInit {
  @Input() folio: string = '';
  @Input() motivoGeneral: string = '';
  @Input() campos: CampoCorreccion[] = [];

  @Output() cerrar = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<{ valores: Record<string, any>; archivo: File | null }>();

  valoresFormulario: Record<string, any> = {};
  archivoComprobante: File | null = null;
  nombreArchivo = signal<string>('');
  errorValidacion = signal<string>('');

  ngOnInit(): void {
    this.campos.forEach(campo => {
      if (campo.tipo !== 'file') {
        this.valoresFormulario[campo.id] = campo.valorActual ?? '';
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.size > 15 * 1024 * 1024) {
        this.errorValidacion.set('El archivo supera el límite permitido de 15 MB.');
        input.value = '';
        return;
      }
      this.archivoComprobante = file;
      this.nombreArchivo.set(file.name);
      this.errorValidacion.set('');
    }
  }

  esFormularioValido(): boolean {
    for (const campo of this.campos) {
      if (campo.tipo === 'file') {
        if (!this.archivoComprobante) return false;
      } else {
        const val = this.valoresFormulario[campo.id];
        if (val === undefined || val === null || String(val).trim() === '') {
          return false;
        }
        if (campo.tipo === 'number' && Number(val) <= 0) {
          return false;
        }
      }
    }
    return true;
  }

  enviarCorrecciones(): void {
    if (!this.esFormularioValido()) {
      this.errorValidacion.set('Por favor completa todos los campos solicitados antes de enviar.');
      return;
    }
    this.errorValidacion.set('');
    this.guardar.emit({
      valores: this.valoresFormulario,
      archivo: this.archivoComprobante
    });
  }

  obtenerIcono(campoId: string): string {
    const mapaIconos: Record<string, string> = {
      nombre_escuela: 'bi-building-fill',
      nivel_educativo: 'bi-mortarboard-fill',
      fecha: 'bi-calendar-event-fill',
      fecha_visita: 'bi-calendar-event-fill',
      hora_visita: 'bi-clock-fill',
      asistentes: 'bi-people-fill',
      numero_visitantes: 'bi-people-fill',
      proposito: 'bi-tree-fill',
      profesores: 'bi-person-badge-fill',
      telefonos: 'bi-telephone-fill',
      correos: 'bi-envelope-at-fill',
      titular_pago: 'bi-person-vcard-fill',
      monto_pagado: 'bi-cash-coin',
      comprobante: 'bi-file-earmark-medical-fill'
    };
    return mapaIconos[campoId] || 'bi-pencil-fill';
  }
}