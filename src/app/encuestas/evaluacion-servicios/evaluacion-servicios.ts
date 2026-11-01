import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-evaluacion-servicios-interno',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './evaluacion-servicios.html',
  styleUrl: './evaluacion-servicios.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvaluacionServiciosComponent implements OnInit {
  private fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    // Encabezado
    folio: ['FOL-2026-001'],
    fecha: ['', Validators.required],
    nombreEscuela: ['', Validators.required],
    instructorRecorrido: ['', Validators.required],

    // Revisión de Procedimientos
    fechaRevision: [''],
    instructorRevision: [''],
    observaciones: [''],

    // Indicadores: Reservados
    estudiantesReservados: [0, [Validators.min(0)]],
    maestrosReservados: [0, [Validators.min(0)]],
    padresReservados: [0, [Validators.min(0)]],

    // Indicadores: Recibidos
    estudiantesRecibidos: [0, [Validators.min(0)]],
    maestrosRecibidos: [0, [Validators.min(0)]],
    padresRecibidos: [0, [Validators.min(0)]],

    // Tiempo de Inicio
    horaInicio: [''],
    retrasoInicio: [0],
    causaInicio: [''],

    // Tiempo de Término
    horaTermino: [''],
    retrasoTermino: [0],
    causaTermino: [''],
  });

  ngOnInit(): void {
    // Asignar fecha actual por defecto
    const hoy = new Date().toISOString().split('T')[0];
    this.form.patchValue({ fecha: hoy });
  }

  guardarEvaluacion(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue();
    console.log('Datos listos para enviar al Backend:', payload);
  }
}