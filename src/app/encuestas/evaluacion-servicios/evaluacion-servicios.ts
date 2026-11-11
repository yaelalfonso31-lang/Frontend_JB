import { Component, ChangeDetectionStrategy, inject, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-evaluacion-servicios-interno',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './evaluacion-servicios.html',
  styleUrl: './evaluacion-servicios.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvaluacionServiciosComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  @ViewChild('signatureCanvas') signatureCanvas!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private signatureDataUrl: string | null = null;

  readonly form = this.fb.nonNullable.group({
    tipoServicio: ['visita_guiada', Validators.required],
    folio: ['BUAP-EVAL-2026-001'],
    fecha: ['', Validators.required],
    nombreEscuela: ['', Validators.required],
    instructorVisita: [''],
    instructorTaller: [''],

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

    // Tiempos
    horaInicio: [''],
    retrasoInicio: [0],
    causaInicio: [''],
    horaTermino: [''],
    retrasoTermino: [0],
    causaTermino: [''],
  });

  get tipoServicioSeleccionado(): string {
    return this.form.controls.tipoServicio.value;
  }

  ngOnInit(): void {
    const hoy = new Date().toISOString().split('T')[0];
    this.form.patchValue({ fecha: hoy, fechaRevision: hoy });
  }

  ngAfterViewInit(): void {
    const canvas = this.signatureCanvas.nativeElement;
    canvas.width = canvas.parentElement?.clientWidth || 500;
    canvas.height = 160;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = '#0f172a';
  }

  /* LÓGICA DE DIBUJO DE FIRMA EN CANVAS (MOUSE + TÁCTIL) */
  startDrawing(event: MouseEvent): void {
    this.isDrawing = true;
    this.ctx.beginPath();
    this.ctx.moveTo(event.offsetX, event.offsetY);
  }

  draw(event: MouseEvent): void {
    if (!this.isDrawing) return;
    this.ctx.lineTo(event.offsetX, event.offsetY);
    this.ctx.stroke();
  }

  startDrawingTouch(event: TouchEvent): void {
    event.preventDefault();
    const rect = this.signatureCanvas.nativeElement.getBoundingClientRect();
    const touch = event.touches[0];
    this.isDrawing = true;
    this.ctx.beginPath();
    this.ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
  }

  drawTouch(event: TouchEvent): void {
    event.preventDefault();
    if (!this.isDrawing) return;
    const rect = this.signatureCanvas.nativeElement.getBoundingClientRect();
    const touch = event.touches[0];
    this.ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    this.ctx.stroke();
  }

  stopDrawing(): void {
    if (this.isDrawing) {
      this.isDrawing = false;
      this.signatureDataUrl = this.signatureCanvas.nativeElement.toDataURL('image/png');
    }
  }

  clearSignature(): void {
    const canvas = this.signatureCanvas.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.signatureDataUrl = null;
  }

  guardarEvaluacion(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      alert('Por favor completa los campos obligatorios del registro.');
      return;
    }

    if (!this.signatureDataUrl) {
      alert('Se requiere la firma electrónica del instructor para guardar la evaluación.');
      return;
    }

    const payload = {
      ...this.form.getRawValue(),
      firmaDigitalBase64: this.signatureDataUrl,
      timestampFirma: new Date().toISOString()
    };

    console.log('Evaluación registrada para enviar al servidor:', payload);

    this.http.post('/api/evaluaciones-internas', payload).subscribe({
      next: () => alert('Evaluación interna guardada exitosamente.'),
      error: () => alert('Error al registrar la evaluación en el servidor.')
    });
  }

  buscarPorFolio(): void {
    const folio = this.form.controls.folio.value.trim();
    if (!folio) {
      alert('Ingresa un número de folio para buscar.');
      return;
    }

    this.http.get<any>(`/api/evaluaciones-internas/${folio}`).subscribe({
      next: (datosPrevios) => {
        // Rellena los campos guardados previamente sin borrar el resto
        this.form.patchValue(datosPrevios);
        alert(`Datos cargados exitosamente para el folio: ${folio}`);
      },
      error: (err) => {
        console.warn('Folio no encontrado:', err);
        alert('No se encontró un registro previo con ese folio. Puedes crearlo como un nuevo registro.');
      }
    });
  }
}