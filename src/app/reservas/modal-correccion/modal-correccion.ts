import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface CampoCorreccion {
  id: string; // Ej: 'nombre_escuela', 'fecha', 'asistentes', 'comprobante'
  etiqueta: string;
  tipo: 'text' | 'number' | 'file' | 'textarea' | 'date' | 'time' | 'email' | 'tel' | 'select';
  valorActual: any;
  mensajeError: string;
}

@Component({
  selector: 'app-modal-correccion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-correccion.html',
  styleUrls: ['./modal-correccion.scss']
})
export class ModalCorreccionComponent implements OnInit, OnChanges {
  @Input() folio: string = '';
  @Input() campos: CampoCorreccion[] = [];

  @Output() cerrar = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<Record<string, any>>();

  valoresFormulario: Record<string, any> = {};
  errorMsg: string = '';

  ngOnInit(): void {
    this.inicializarValores();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['campos']) {
      this.inicializarValores();
    }
  }

  private inicializarValores(): void {
    this.valoresFormulario = {};
    for (const campo of this.campos) {
      if (campo.tipo === 'file') {
        this.valoresFormulario[campo.id] = null;
      } else if (campo.id === 'nivel_educativo') {
        this.valoresFormulario[campo.id] = String(campo.valorActual || 'primaria').toLowerCase();
      } else if (campo.id === 'fecha' || campo.id === 'fecha_visita') {
        this.valoresFormulario[campo.id] = String(campo.valorActual || '').slice(0, 10);
      } else {
        this.valoresFormulario[campo.id] = campo.valorActual ?? '';
      }
    }
    this.errorMsg = '';
  }

  onFileSelected(campoId: string, event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    if (inputEl.files && inputEl.files.length > 0) {
      this.valoresFormulario[campoId] = inputEl.files[0];
      this.errorMsg = '';
    }
  }

  formularioValido(): boolean {
    if (!this.campos || this.campos.length === 0) return false;

    return this.campos.every((campo) => {
      const val = this.valoresFormulario[campo.id];
      if (campo.tipo === 'file' || campo.id === 'comprobante') {
        return val instanceof File;
      }
      if (campo.tipo === 'number' || campo.id === 'asistentes' || campo.id === 'numero_visitantes' || campo.id === 'monto_pagado') {
        return val !== null && val !== undefined && val !== '' && Number(val) > 0;
      }
      return val !== null && val !== undefined && String(val).trim().length > 0;
    });
  }

  enviarCorrecciones(): void {
    if (!this.formularioValido()) {
      this.errorMsg = 'Completa todos los campos requeridos (y adjunta el archivo si se solicita) antes de enviar.';
      return;
    }

    this.errorMsg = '';
    this.guardar.emit(this.valoresFormulario);
  }
}