import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgOptimizedImage } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-encuesta-satisfaccion',
  standalone: true,
  imports: [ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './encuesta-satisfaccion.html',
  styleUrl: './encuesta-satisfaccion.scss'
})
export class EncuestaSatisfaccionComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);

  encuestaForm = this.fb.group({
    tipoServicio: ['visita_guiada', Validators.required],
    nombreTaller: [''],
    conociaJardin: ['', Validators.required],
    gustoVisita: ['', Validators.required],
    porqueNoGusto: [''],
    comoContacto: ['', Validators.required],
    atencionRecibida: [null, Validators.required],
    calidadInformacionVisita: [null],
    calidadInformacionTaller: [null],
    cumplioObjetivoVisita: [null],
    cumplioObjetivoTaller: [null],
    materialesAdecuadosVisita: [null],
    materialesAdecuadosTaller: [null],
    instalacionesAdecuadasVisita: [null],
    instalacionesAdecuadasTaller: [null],
    explicacionClaraVisita: [null],
    explicacionClaraTaller: [null],
    resolvioDudasVisita: [null],
    resolvioDudasTaller: [null],
    captoAtencionVisita: [null],
    captoAtencionTaller: [null],
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
      this.http.post('/api/encuestas', this.encuestaForm.getRawValue()).subscribe({
        next: () => {
          alert('¡Muchas gracias! Tu encuesta ha sido registrada exitosamente.');
          this.encuestaForm.reset({ tipoServicio: 'visita_guiada' });
          this.router.navigate(['/inicio']);
        },
        error: (err) => {
          console.error('Error al guardar encuesta:', err);
          alert('No se pudo enviar la encuesta. Por favor intenta de nuevo.');
        }
      });
    } else {
      this.encuestaForm.markAllAsTouched();
      alert('Por favor responde las preguntas obligatorias antes de enviar.');
    }
  }

  readonly opcionesAtencion = [
  { valor: 1, img: '/assets/caritas/mala.png', label: 'Mala' },
  { valor: 2, img: '/assets/caritas/regular.png', label: 'Regular' },
  { valor: 3, img: '/assets/caritas/buena.png', label: 'Buena' }
];
}