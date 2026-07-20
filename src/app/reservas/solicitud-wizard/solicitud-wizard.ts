import { Component, ChangeDetectionStrategy, inject, signal, computed, effect, AfterViewInit, ElementRef, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray, FormControl } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgOptimizedImage } from '@angular/common';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';

@Component({
  selector: 'app-solicitud-wizard',
  standalone: true,
  imports: [ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './solicitud-wizard.html',
  styleUrl: './solicitud-wizard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SolicitudWizardComponent implements AfterViewInit {
  private fb = inject(FormBuilder);

  // Referencias a los inputs de Flatpickr
  fechaInput = viewChild<ElementRef>('fechaInput');
  horaInput = viewChild<ElementRef>('horaInput');

  // Control del paso actual del wizard (1 al 5)
  pasoActual = signal<number>(1);

  // Diccionario de precios (Adaptado de tu script-pasos.js)
  preciosServicios: Record<string, number> = {
    visita_guiada: 30, visita_tematica: 99, conociendo_medio_ambiente: 125,
    crea_herbario: 125, fosiles_plantas: 99, detective_botanico: 99,
    horticultura: 125, insectos: 99, lombricomposta: 125, terrarios: 145,
    colecta_plantas: 190, plantas_medicinales: 190
  };

  // Formulario Reactivo principal
  solicitudForm = this.fb.group({
    // Datos de Institución
    escuela: ['', Validators.required],
    calle: ['', Validators.required],
    num_ext: ['', Validators.required],
    num_int: [''],
    colonia: ['', Validators.required],
    cp: ['', [Validators.required, Validators.pattern('^[0-9]{5}$')]],
    municipio: ['', Validators.required],

    // Arrays dinámicos para contactos múltiples
    profesores: this.fb.array([this.fb.control('', Validators.required)]),
    telefonos: this.fb.array([this.fb.control('', [Validators.required, Validators.pattern('^[0-9]{10}$')])]),
    correos: this.fb.array([this.fb.control('', [Validators.required, Validators.email])]),

    nivel: ['', Validators.required],
    grado: ['', Validators.required],

    // Servicios y Cantidades
    servicio: ['', Validators.required],
    fecha: ['', Validators.required],
    hora: ['', Validators.required],
    num_grupos: [1, [Validators.required, Validators.min(1)]],
    estudiantes_grupo: [20, [Validators.required, Validators.min(10), Validators.max(60)]],
    num_maestros: [2, [Validators.required, Validators.min(0)]],
    num_padres: [0, [Validators.required, Validators.min(0)]],
    lunch: ['', Validators.required]
  });

  // Convertimos los cambios del formulario en una Señal para cálculos reactivos
  formValues = toSignal(this.solicitudForm.valueChanges, { initialValue: this.solicitudForm.value });

  // Cálculos automáticos usando computed() (Reemplaza la función calcularMontos() de tu JS)
  totalAlumnos = computed(() => {
    const vals = this.formValues();
    return (vals.num_grupos || 1) * (vals.estudiantes_grupo || 0);
  });

  montoTotal = computed(() => {
    const vals = this.formValues();
    const servicioSeleccionado = vals.servicio as string;
    const precio = this.preciosServicios[servicioSeleccionado] || 0;
    const totalPagantes = this.totalAlumnos() + (vals.num_padres || 0);
    return totalPagantes * precio;
  });

  montoAnticipo = computed(() => this.montoTotal() * 0.5);

  ngAfterViewInit() {
    // Inicialización de Flatpickr cuando la vista carga
      if (this.fechaInput()?.nativeElement) {
        const minDate = (() => { const d = new Date(); d.setDate(d.getDate() + 14); return d; })();
        flatpickr(this.fechaInput()!.nativeElement, {
          locale: Spanish,
          // flatpickr accepts Date objects for minDate; compute 14 days ahead without fp_incr
          minDate: minDate,
          disable: [(date) => date.getDay() === 0 || date.getDay() === 6] // Sin fines de semana
        });
      }
  }

  // Métodos para controlar el FormArray (Agregar/Eliminar campos dinámicos)
  get profesores() { return this.solicitudForm.get('profesores') as FormArray; }
  get telefonos() { return this.solicitudForm.get('telefonos') as FormArray; }
  get correos() { return this.solicitudForm.get('correos') as FormArray; }

  agregarCampo(tipo: 'profesor' | 'telefono' | 'correo') {
    if (tipo === 'profesor') this.profesores.push(this.fb.control('', Validators.required));
    if (tipo === 'telefono') this.telefonos.push(this.fb.control('', [Validators.required, Validators.pattern('^[0-9]{10}$')]));
    if (tipo === 'correo') this.correos.push(this.fb.control('', [Validators.required, Validators.email]));
  }

  eliminarCampo(tipo: 'profesor' | 'telefono' | 'correo', index: number) {
    if (tipo === 'profesor') this.profesores.removeAt(index);
    if (tipo === 'telefono') this.telefonos.removeAt(index);
    if (tipo === 'correo') this.correos.removeAt(index);
  }

  // Navegación del Wizard
  irAPaso(paso: number) {
    if (paso >= 1 && paso <= 5) {
      this.pasoActual.set(paso);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}