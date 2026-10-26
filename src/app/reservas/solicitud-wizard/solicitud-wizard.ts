import { Component, ChangeDetectionStrategy, inject, signal, computed, AfterViewInit, OnInit, ElementRef, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgOptimizedImage } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { HeaderComponent } from '../../shared/header/header';
import { ChecklistRegistryService } from '../../colaborador/checklists/checklist-registry.service';

export function serviciosValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const seleccionados = control.value as string[];

    if (!seleccionados || seleccionados.length === 0) return { required: true };
    if (seleccionados.length > 3) return { maxSelections: true };

    const visitas = ['visita_guiada', 'visita_tematica'];
    const visitasSeleccionadas = seleccionados.filter(s => visitas.includes(s));

    if (visitasSeleccionadas.length > 1) return { maxVisitas: true };

    return null;
  };
}
@Component({
  selector: 'app-solicitud-wizard',
  standalone: true,
  imports: [ReactiveFormsModule, NgOptimizedImage, HeaderComponent, RouterOutlet],
  templateUrl: './solicitud-wizard.html',
  styleUrl: './solicitud-wizard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SolicitudWizardComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder).nonNullable;
  private router = inject(Router);
  private http = inject(HttpClient);
  private checklistRegistry = inject(ChecklistRegistryService);
  fechaInput = viewChild<ElementRef>('fechaInput');
  fechaContainer = viewChild<ElementRef>('fechaContainer');
  horaInput = viewChild<ElementRef>('horaInput');
  horaContainer = viewChild<ElementRef>('horaContainer');
  pasoActual = signal<number>(1);
  archivoFisico: File | null = null;
  nombreArchivo = signal<string>('');

  folioAsignado = signal<string>('');
  fechaGeneracion = signal<Date>(new Date());
  politicasAceptadas = signal<boolean>(false);
  enviandoSolicitud = signal<boolean>(false);
  fechasBloqueadas = signal<string[]>([]);

  preciosServicios: Record<string, number> = {
    visita_guiada: 30, visita_tematica: 99, conociendo_medio_ambiente: 125,
    crea_herbario: 125, fosiles_plantas: 99, detective_botanico: 99,
    horticultura: 125, insectos: 99, lombricomposta: 125, terrarios: 145,
    colecta_plantas: 190, plantas_medicinales: 190
  };

  private regexNombres = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\.,'-]+$/;
  private regexDireccion = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\.,#()°"'-]+$/;
  private regexAlfanumerico = /^[a-zA-Z0-9\s\/-]+$/;
  // Permite números con o sin "$", comas y "MXN" (ej. 350, 350.00, $350.00 MXN)
  private regexMonto = /^\$?\s*\d+(,\d{3})*(\.\d{1,2})?(\s*MXN)?$/i;

  solicitudForm = this.fb.group({
    escuela: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120), Validators.pattern(this.regexDireccion)]],
    calle: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(this.regexDireccion)]],
    num_ext: ['', [Validators.required, Validators.maxLength(15), Validators.pattern(this.regexAlfanumerico)]],
    num_int: ['', [Validators.maxLength(15), Validators.pattern(this.regexAlfanumerico)]],
    colonia: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(this.regexDireccion)]],
    cp: ['', [Validators.required, Validators.pattern('^[0-9]{5}$')]],
    municipio: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(60), Validators.pattern(this.regexDireccion)]],

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
    grado: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(60)]],

    servicios: [[] as string[], [serviciosValidator()]],
    notas: ['', [Validators.maxLength(500)]],

    fecha: ['', Validators.required],
    hora: ['', Validators.required],
    num_grupos: [1, [Validators.required, Validators.min(1), Validators.max(20)]],
    estudiantes_grupo: [20, [Validators.required, Validators.min(10), Validators.max(60)]],
    num_maestros: [2, [Validators.required, Validators.min(0), Validators.max(20)]],
    num_padres: [0, [Validators.required, Validators.min(0), Validators.max(50)]],
    lunch: ['', Validators.required],

    comprobante: [''],
    titular: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100), Validators.pattern(this.regexDireccion)]],
    monto_pagar: ['', [Validators.required, Validators.pattern(this.regexMonto)]],
    concepto_pago: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(150)]]
  });

  formValues = toSignal(this.solicitudForm.valueChanges, { initialValue: this.solicitudForm.getRawValue() });

  totalAlumnos = computed(() => {
    const vals = this.formValues();
    return (vals.num_grupos || 1) * (vals.estudiantes_grupo || 0);
  });

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
  ngOnInit(): void {
    this.http.get<{ limiteVisitantes: number; diasFestivos: { id: number; fecha: string; nombre: string }[] }>('/api/configuracion')
      .subscribe({
        next: (config) => {
          const fechas = (config.diasFestivos || []).map(d => d.fecha);
          this.fechasBloqueadas.set(fechas);
          this.inicializarCalendarios();
        },
        error: () => this.inicializarCalendarios()
      });
  }

  ngAfterViewInit(): void {
    this.inicializarCalendarios();
  }

  inicializarCalendarios(): void {
    if (this.fechaInput()?.nativeElement) {
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + 14);
      const bloqueadas = new Set(this.fechasBloqueadas());

      flatpickr(this.fechaInput()!.nativeElement, {
        locale: Spanish,
        minDate: minDate,
        appendTo: this.fechaContainer()!.nativeElement,
        defaultDate: this.solicitudForm.controls.fecha.value || undefined,
        disable: [
          (date) => {
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            const iso = `${yyyy}-${mm}-${dd}`;
            return date.getDay() === 0 || date.getDay() === 6 || bloqueadas.has(iso);
          }
        ],
        disableMobile: true,
        monthSelectorType: 'static',
        dateFormat: 'Y-m-d',
        altInput: false,
        onChange: (_selectedDates, dateStr) => {
          this.solicitudForm.controls.fecha.setValue(dateStr);
          this.solicitudForm.controls.fecha.markAsTouched();
        }
      });
    }

    if (this.horaInput()?.nativeElement) {
      flatpickr(this.horaInput()!.nativeElement, {
        appendTo: this.horaContainer()!.nativeElement, // <--- CLAVE: Lo mete dentro del input-group
        enableTime: true,
        noCalendar: true,
        dateFormat: 'H:i',
        defaultDate: this.solicitudForm.controls.hora.value || undefined,
        minTime: '09:00',
        maxTime: '15:00',
        time_24hr: true,
        minuteIncrement: 30,
        disableMobile: true,
        onChange: (_selectedDates, dateStr) => {
          this.solicitudForm.controls.hora.setValue(dateStr);
          this.solicitudForm.controls.hora.markAsTouched();
        }
      });
    }
  }

  capturarArchivo(event: any): void {
    if (event.target.files && event.target.files.length > 0) {
      const file: File = event.target.files[0];
      if (file.size > 15 * 1024 * 1024) {
        alert('El archivo supera el límite permitido de 15MB.');
        event.target.value = '';
        return;
      }
      this.archivoFisico = file;
      this.nombreArchivo.set(file.name);
    }
  }

  toggleServicio(id: string, event: Event): void {
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

  agregarCampo(tipo: 'profesor' | 'telefono' | 'correo'): void {
    if (tipo === 'profesor') this.profesores.push(this.fb.control('', [Validators.required, Validators.minLength(3), Validators.maxLength(80), Validators.pattern(this.regexNombres)]));
    if (tipo === 'telefono') this.telefonos.push(this.fb.control('', [Validators.required, Validators.pattern('^[0-9]{10}$')]));
    if (tipo === 'correo') this.correos.push(this.fb.control('', [Validators.required, Validators.email, Validators.maxLength(80)]));
  }

  eliminarCampo(tipo: 'profesor' | 'telefono' | 'correo', index: number): void {
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
      const tieneArchivo = this.archivoFisico !== null;
      return tieneArchivo && ctrl.titular.valid && ctrl.monto_pagar.valid && ctrl.concepto_pago.valid;
    }

    return true;
  }

  private obtenerCamposInvalidosPaso1(): string[] {
    const ctrl = this.solicitudForm.controls;
    const faltantes: string[] = [];
    if (ctrl.escuela.invalid) faltantes.push('Nombre de la Escuela');
    if (ctrl.calle.invalid || ctrl.num_ext.invalid || ctrl.colonia.invalid || ctrl.cp.invalid || ctrl.municipio.invalid) {
      faltantes.push('Dirección completa (C.P. de 5 dígitos)');
    }
    if (ctrl.profesores.invalid) faltantes.push('Profesor(es) responsable(s) (solo letras)');
    if (ctrl.telefonos.invalid) faltantes.push('Teléfono(s) (10 dígitos numéricos)');
    if (ctrl.correos.invalid) faltantes.push('Correo(s) electrónico(s) válido(s)');
    if (ctrl.nivel.invalid || ctrl.grado.invalid) faltantes.push('Nivel Escolar y Grado/Carrera');
    if (ctrl.servicios.invalid) faltantes.push('Selección de Servicios (1 a 3 opciones, máx. 1 visita)');
    if (ctrl.fecha.invalid || ctrl.hora.invalid) faltantes.push('Fecha y Horario de visita');
    if (ctrl.num_grupos.invalid || ctrl.estudiantes_grupo.invalid || ctrl.num_maestros.invalid || ctrl.num_padres.invalid) {
      faltantes.push('Número de grupos y asistentes (10 a 60 alumnos por grupo)');
    }
    if (ctrl.lunch.invalid) faltantes.push('Indicar si tomarán lunch (Sí / No)');
    return faltantes;
  }

  irAPaso(paso: number): void {
    const actual = this.pasoActual();

    // Validar Paso 1 antes de avanzar
    if (paso > actual && actual === 1 && !this.esPasoValido(1)) {
      this.solicitudForm.markAllAsTouched();
      const errores = this.obtenerCamposInvalidosPaso1();
      alert('Por favor revisa los siguientes campos antes de continuar:\n\n• ' + errores.join('\n• '));
      return;
    }

    // Validar Paso 3 antes de avanzar
    if (paso > actual && actual === 3 && !this.esPasoValido(3)) {
      this.solicitudForm.controls.titular.markAsTouched();
      this.solicitudForm.controls.monto_pagar.markAsTouched();
      this.solicitudForm.controls.concepto_pago.markAsTouched();
      if (!this.archivoFisico) {
        alert('Debes adjuntar el archivo o foto de tu comprobante de pago (PDF, JPG o PNG).');
      } else {
        alert('Revisa los datos del reporte de pago: Nombre del titular, Monto a pagar y Concepto (mínimo 5 caracteres).');
      }
      return;
    }

    // Si entra al Paso 3 y el monto a pagar está vacío, sugerimos el 50% de anticipo
    if (paso === 3 && !this.solicitudForm.controls.monto_pagar.value && this.montoAnticipo() > 0) {
      this.solicitudForm.controls.monto_pagar.setValue(this.montoAnticipo().toFixed(2));
    }

    if (paso >= 1 && paso <= 6) {
      this.pasoActual.set(paso);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (paso === 1) {
        setTimeout(() => this.inicializarCalendarios(), 50);
      }
    }
  }

  enviarSolicitud(): void {
    // Candado estricto: evita múltiples clics rápidos o reenvíos si ya tiene folio
    if (this.enviandoSolicitud() || this.folioAsignado()) {
      return;
    }

    if (!this.esPasoValido(1)) {
      alert('Hay datos incompletos en el Paso 1.');
      this.irAPaso(1);
      return;
    }

    if (!this.esPasoValido(3) || !this.archivoFisico) {
      alert('Falta información o el archivo del comprobante en el Paso 3.');
      this.irAPaso(3);
      return;
    }

    this.enviandoSolicitud.set(true);

    const formVal = this.solicitudForm.getRawValue();
    // Limpiamos "$" Carlos, comas o "MXN" del monto_pagar para enviar un número limpio a Python
    const montoLimpio = String(formVal.monto_pagar).replace(/[^0-9.]/g, '') || String(this.montoAnticipo());

    const datosParaPython = {
      ...formVal,
      monto_pagar: montoLimpio,
      monto_estimado: this.montoTotal()
    };

    const formData = new FormData();
    formData.append('datos', JSON.stringify(datosParaPython));
    formData.append('comprobante', this.archivoFisico);

    this.http.post<{ folio: string }>('/api/solicitudes', formData)
      .subscribe({
        next: (respuesta: any) => {
          this.enviandoSolicitud.set(false);
          this.folioAsignado.set(respuesta.folio);
          this.checklistRegistry.registerSubmittedRequest({
            folio: respuesta.folio,
            school: formVal.escuela,
            date: formVal.fecha,
            services: formVal.servicios
          });
          this.irAPaso(6);
        },
        error: (err) => {
          this.enviandoSolicitud.set(false);
          console.error('Error del servidor:', err);
          alert('Hubo un problema de conexión al guardar la solicitud. Intenta nuevamente.');
        }
      });
  }

  salirAlMenu(): void {
    this.router.navigate(['/inicio']);
  }

  descargarResumenPDF(): void {
    const doc = new jsPDF();
    const vals = this.solicitudForm.getRawValue();
    const folio = this.folioAsignado();

    doc.setFillColor(143, 186, 66);
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('RESUMEN DE SOLICITUD - JARDÍN BOTÁNICO', 14, 16);

    doc.setTextColor(44, 62, 80);
    doc.setFontSize(12);
    doc.text(`Folio Asignado: ${folio}`, 14, 40);
    doc.text(`Fecha de Emisión: ${this.fechaGeneracion().toLocaleDateString()}`, 14, 48);

    autoTable(doc, {
      startY: 55,
      headStyles: { fillColor: [27, 55, 31] },
      body: [
        ['Institución / Escuela', vals.escuela],
        ['Nivel y Grado', `${vals.nivel} - ${vals.grado}`],
        ['Fecha de Visita', vals.fecha],
        ['Horario', vals.hora],
        ['Total de Alumnos', this.totalAlumnos().toString()],
        ['Monto Total Estimado', `$${this.montoTotal().toFixed(2)} MXN`],
        ['Anticipo a Pagar (50%)', `$${this.montoAnticipo().toFixed(2)} MXN`]
      ],
    });

    doc.save(`Solicitud_${folio}.pdf`);
  }

  descargarPoliticas(): void {
    const link = document.createElement('a');
    link.href = '/Reglamento_JardinBotanico.pdf';
    link.download = 'Politicas_y_Reglamento.pdf';
    link.click();
  }
}