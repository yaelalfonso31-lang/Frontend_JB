import { Component, ChangeDetectionStrategy, inject, signal, computed, AfterViewInit, ElementRef, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgOptimizedImage } from '@angular/common';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';

// Validador personalizado para las reglas de los servicios
export function serviciosValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const seleccionados = control.value as string[];

    if (!seleccionados || seleccionados.length === 0) return { required: true };
    if (seleccionados.length > 3) return { maxSelections: true };

    // Limitar a 1 solo tipo de visita
    const visitas = ['visita_guiada', 'visita_tematica'];
    const visitasSeleccionadas = seleccionados.filter(s => visitas.includes(s));

    if (visitasSeleccionadas.length > 1) return { maxVisitas: true };

    return null;
  };
}

@Component({
  selector: 'app-solicitud-wizard',
  standalone: true,
  imports: [ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './solicitud-wizard.html',
  styleUrl: './solicitud-wizard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SolicitudWizardComponent implements AfterViewInit {
  private fb = inject(FormBuilder).nonNullable;

  fechaInput = viewChild<ElementRef>('fechaInput');
  horaInput = viewChild<ElementRef>('horaInput');

  pasoActual = signal<number>(1);

  preciosServicios: Record<string, number> = {
    visita_guiada: 30, visita_tematica: 99, conociendo_medio_ambiente: 125,
    crea_herbario: 125, fosiles_plantas: 99, detective_botanico: 99,
    horticultura: 125, insectos: 99, lombricomposta: 125, terrarios: 145,
    colecta_plantas: 190, plantas_medicinales: 190
  };

  private regexNombres = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\.,'-]+$/;
  private regexDireccion = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\.,#-]+$/;
  private regexAlfanumerico = /^[a-zA-Z0-9\s-]+$/;
  private regexMonto = /^\d+(\.\d{1,2})?$/;

  solicitudForm = this.fb.group({
    escuela: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100), Validators.pattern(this.regexNombres)]],
    calle: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100), Validators.pattern(this.regexDireccion)]],
    num_ext: ['', [Validators.required, Validators.maxLength(10), Validators.pattern(this.regexAlfanumerico)]],
    num_int: ['', [Validators.maxLength(10), Validators.pattern(this.regexAlfanumerico)]],
    colonia: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100), Validators.pattern(this.regexDireccion)]],
    cp: ['', [Validators.required, Validators.pattern('^[0-9]{5}$')]],
    municipio: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(this.regexNombres)]],

    profesores: this.fb.array([
      this.fb.control('', [Validators.required, Validators.minLength(3), Validators.maxLength(80), Validators.pattern(this.regexNombres)])
    ]),
    telefonos: this.fb.array([
      this.fb.control('', [Validators.required, Validators.pattern('^[0-9]{10}$')])
    ]),
    correos: this.fb.array([
      this.fb.control('', [Validators.required, Validators.email, Validators.maxLength(80)])
    ]),

    nivel: ['', Validators.required],
    grado: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],

    // NUEVO: Array de servicios y campo de notas
    servicios: [[] as string[], [serviciosValidator()]],
    notas: ['', [Validators.maxLength(500)]],

    fecha: ['', Validators.required],
    hora: ['', Validators.required],
    num_grupos: [1, [Validators.required, Validators.min(1), Validators.max(20)]],
    estudiantes_grupo: [20, [Validators.required, Validators.min(10), Validators.max(60)]],
    num_maestros: [2, [Validators.required, Validators.min(0), Validators.max(20)]],
    num_padres: [0, [Validators.required, Validators.min(0), Validators.max(50)]],
    lunch: ['', Validators.required],

    comprobante: ['', Validators.required],
    titular: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100), Validators.pattern(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\.,&'-]+$/)]],
    monto_pagar: ['', [Validators.required, Validators.pattern(this.regexMonto)]],
    concepto_pago: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(150)]]
  });

  formValues = toSignal(this.solicitudForm.valueChanges, { initialValue: this.solicitudForm.getRawValue() });

  totalAlumnos = computed(() => {
    const vals = this.formValues();
    return (vals.num_grupos || 1) * (vals.estudiantes_grupo || 0);
  });

  // NUEVO: Sumatoria de los precios basada en el arreglo 'servicios'
  montoTotal = computed(() => {
    const vals = this.formValues();
    const seleccionados = vals.servicios || [];

    const sumaPrecios = seleccionados.reduce((suma, servicioId) => {
      return suma + (this.preciosServicios[servicioId] || 0);
    }, 0);

    const totalPagantes = this.totalAlumnos() + (vals.num_padres || 0);
    return totalPagantes * sumaPrecios;
  });

  montoAnticipo = computed(() => this.montoTotal() * 0.5);

  ngAfterViewInit() {
    if (this.fechaInput()?.nativeElement) {
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + 14);

      flatpickr(this.fechaInput()!.nativeElement, {
        locale: Spanish,
        minDate: minDate,
        disable: [(date) => date.getDay() === 0 || date.getDay() === 6]
      });
    }

    if (this.horaInput()?.nativeElement) {
      flatpickr(this.horaInput()!.nativeElement, {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        minTime: "09:00",
        maxTime: "15:00",
        time_24hr: true,
        minuteIncrement: 30,
        disableMobile: true
      });
    }
  }

  // NUEVO: Método para controlar el estado de los checkboxes
  toggleServicio(id: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    const ctrl = this.solicitudForm.controls.servicios;
    let actuales = [...ctrl.value];

    if (isChecked) {
      if (!actuales.includes(id)) actuales.push(id);
    } else {
      actuales = actuales.filter(s => s !== id);
    }

    ctrl.setValue(actuales);
    ctrl.markAsTouched();
  }

  get profesores() { return this.solicitudForm.get('profesores') as FormArray; }
  get telefonos() { return this.solicitudForm.get('telefonos') as FormArray; }
  get correos() { return this.solicitudForm.get('correos') as FormArray; }

  agregarCampo(tipo: 'profesor' | 'telefono' | 'correo') {
    if (tipo === 'profesor') this.profesores.push(this.fb.control('', [Validators.required, Validators.minLength(3), Validators.maxLength(80), Validators.pattern(this.regexNombres)]));
    if (tipo === 'telefono') this.telefonos.push(this.fb.control('', [Validators.required, Validators.pattern('^[0-9]{10}$')]));
    if (tipo === 'correo') this.correos.push(this.fb.control('', [Validators.required, Validators.email, Validators.maxLength(80)]));
  }

  eliminarCampo(tipo: 'profesor' | 'telefono' | 'correo', index: number) {
    if (tipo === 'profesor') this.profesores.removeAt(index);
    if (tipo === 'telefono') this.telefonos.removeAt(index);
    if (tipo === 'correo') this.correos.removeAt(index);
  }

  esPasoValido(paso: number): boolean {
    const ctrl = this.solicitudForm.controls;

    if (paso === 1) {
      return ctrl.escuela.valid && ctrl.calle.valid && ctrl.num_ext.valid && ctrl.num_int.valid &&
        ctrl.colonia.valid && ctrl.cp.valid && ctrl.municipio.valid && ctrl.profesores.valid &&
        ctrl.telefonos.valid && ctrl.correos.valid && ctrl.nivel.valid && ctrl.grado.valid &&
        ctrl.servicios.valid && ctrl.fecha.valid && ctrl.hora.valid && ctrl.num_grupos.valid &&
        ctrl.estudiantes_grupo.valid && ctrl.num_maestros.valid && ctrl.num_padres.valid &&
        ctrl.lunch.valid && ctrl.notas.valid;
    }

    if (paso === 3) {
      return ctrl.comprobante.valid && ctrl.titular.valid && ctrl.monto_pagar.valid && ctrl.concepto_pago.valid;
    }

    return true;
  }

  irAPaso(paso: number) {
    if (paso >= 1 && paso <= 5) {
      this.pasoActual.set(paso);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  enviarSolicitud() {
    if (this.solicitudForm.valid) {
      const datosFinales = this.solicitudForm.getRawValue();
      console.log('Enviando datos al servidor:', datosFinales);
    } else {
      this.solicitudForm.markAllAsTouched();
    }
  }
}