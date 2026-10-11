import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-encuesta-satisfaccion',
  standalone: true,
  imports: [ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './encuesta-satisfaccion.html',
  styleUrl: './encuesta-satisfaccion.scss'
})
export class EncuestaSatisfaccionComponent {
  private fb = inject(FormBuilder);

  encuestaForm = this.fb.group({
    tipoServicio: ['visita_guiada', Validators.required],
    nombreTaller: [''],
    conociaJardin: ['', Validators.required],
    gustoVisita: ['', Validators.required],
    porqueNoGusto: [''],
    comoContacto: ['', Validators.required],
    
    // P4: Atención recibida
    atencionRecibida: [null, Validators.required],

    // P5: Subcriterios de Contenido / Información
    calidadInformacionVisita: [null],
    calidadInformacionTaller: [null],
    cumplioObjetivoVisita: [null],
    cumplioObjetivoTaller: [null],
    materialesAdecuadosVisita: [null],
    materialesAdecuadosTaller: [null],
    instalacionesAdecuadasVisita: [null],
    instalacionesAdecuadasTaller: [null],

    // P6: Subcriterios del Instructor
    explicacionClaraVisita: [null],
    explicacionClaraTaller: [null],
    resolvioDudasVisita: [null],
    resolvioDudasTaller: [null],
    captoAtencionVisita: [null],
    captoAtencionTaller: [null],

    // P7 a P11
    calificacionGeneral: [null, Validators.required],
    cumplioExpectativas: ['', Validators.required],
    porqueNoExpectativas: [''],
    estadoSanitarios: [null],
    estadoExteriores: [null],
    estadoSalones: [null],
    pidioPropina: ['', Validators.required],
    comentarios: ['']
  });

  get tipoServicioSeleccionado(): string {
    return this.encuestaForm.get('tipoServicio')?.value || 'visita_guiada';
  }

  enviarEncuesta(): void {
    if (this.encuestaForm.valid) {
      console.log('Encuesta lista para enviar:', this.encuestaForm.value);
    } else {
      this.encuestaForm.markAllAsTouched();
    }
  }
}