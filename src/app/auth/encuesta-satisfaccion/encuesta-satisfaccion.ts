import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-encuesta-satisfaccion',
  standalone: true,
  imports: [ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './encuesta-satisfaccion.html',
  styleUrl: './encuesta-satisfaccion.scss',
})
export class EncuestaSatisfaccionComponent {
  private fb = inject(FormBuilder);

  encuestaForm = this.fb.group({
    conociaJardin: ['', Validators.required],
    gustoVisita: ['', Validators.required],
    porqueNoGusto: [''],
    comoContacto: ['', Validators.required],
    atencionRecibida: [null, Validators.required],
    calidadInformacion: [null, Validators.required],
    cumplioObjetivo: [null],
    materialesAdecuados: [null],
    evaluacionInstructor: [null, Validators.required],
    calificacionGeneral: [null, Validators.required],
    cumplioExpectativas: ['', Validators.required],
    porqueNoExpectativas: [''],
    estadoSanitarios: [null],
    estadoExteriores: [null],
    pidioPropina: ['', Validators.required],
    comentarios: ['']
  });

  enviarEncuesta(): void {
    if (this.encuestaForm.valid) {
      console.log('Datos enviados:', this.encuestaForm.value);
    } else {
      this.encuestaForm.markAllAsTouched();
    }
  }
}
