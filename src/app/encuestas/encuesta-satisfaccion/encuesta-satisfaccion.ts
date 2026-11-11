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
    comentarios: [''],
  });

  get tipoServicioSeleccionado(): string {
    return this.encuestaForm.get('tipoServicio')?.value || 'visita_guiada';
  }

  enviando = false;

  readonly opcionesAtencion = [
    { valor: 1, img: '/assets/caritas/mala.png', label: 'Mala' },
    { valor: 2, img: '/assets/caritas/regular.png', label: 'Regular' },
    { valor: 3, img: '/assets/caritas/buena.png', label: 'Buena' }
  ];

  enviarEncuesta(): void {
    if (this.enviando) return;

    if (this.encuestaForm.invalid) {
      this.encuestaForm.markAllAsTouched();
      alert('Por favor responde las preguntas obligatorias antes de enviar.');
      return;
    }

    this.enviando = true;
    const formValues = this.encuestaForm.getRawValue();

    // Mapeo adaptado para empatar con la estructura de la BD y FastAPI
    const payload = {
      tipo_servicio: formValues.tipoServicio,
      nombre_taller: formValues.nombreTaller || null,
      conocia_jardin: formValues.conociaJardin,
      gusto_visita: formValues.gustoVisita,
      porque_no_gusto: formValues.porqueNoGusto || null,
      como_contacto: formValues.comoContacto,
      atencion_recibida: formValues.atencionRecibida,
      calificacion_general: formValues.calificacionGeneral,
      cumplio_expectativas: formValues.cumplioExpectativas,
      porque_no_expectativas: formValues.porqueNoExpectativas || null,
      pidio_propina: formValues.pidioPropina,
      comentarios: formValues.comentarios || null,
      respuestas_detalle: formValues // Guarda el objeto JSON completo en Mariadb
    };

    // Petición HTTP a la ruta relativa enviada en el proxy /api/encuestas
    this.http.post('/api/encuestas', payload).subscribe({
      next: () => {
        this.enviando = false;
        alert('¡Muchas gracias! Tu encuesta ha sido registrada exitosamente.');
        this.encuestaForm.reset({ tipoServicio: 'visita_guiada' });
        this.router.navigate(['/inicio']);
      },
      error: (err) => {
        this.enviando = false;
        console.error('Error al guardar encuesta:', err);
        const mensajeError = err?.error?.detail || 'No se pudo enviar la encuesta. Por favor intenta de nuevo.';
        alert(mensajeError);
      }
    });
  }
}