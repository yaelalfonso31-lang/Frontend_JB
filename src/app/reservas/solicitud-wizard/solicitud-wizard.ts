import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, inject, signal, effect } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  FormBuilder,
  FormArray,
  FormControl,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';

@Component({
  selector: 'app-solicitud-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterOutlet, NgOptimizedImage, HeaderComponent],
  templateUrl: './solicitud-wizard.html',
  styleUrl: './solicitud-wizard.scss'
})
export class SolicitudWizardComponent implements AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  // Referencias a los inputs de Fecha y Hora en el Paso 1
  @ViewChild('fechaInput') fechaInput?: ElementRef<HTMLInputElement>;
  @ViewChild('horaInput') horaInput?: ElementRef<HTMLInputElement>;

  private fpFecha: any;
  private fpHora: any;

  // Signals de estado del Wizard
  pasoActual = signal<number>(1);
  folioAsignado = signal<string>('');
  politicasAceptadas = signal<boolean>(false);

  // Signals para cálculos de totales
  totalAlumnos = signal<number>(0);
  montoTotal = signal<number>(0);
  montoAnticipo = signal<number>(0);

  // Archivo de comprobante adjunto en Paso 3
  archivoComprobante: File | null = null;

  // Catálogo de precios y nombres de los servicios educativos
  readonly catalogoServicios: Record<string, { nombre: string; precio: number; tipo: 'visita' | 'taller' }> = {
    visita_guiada: { nombre: 'Visita Guiada', precio: 30, tipo: 'visita' },
    visita_tematica: { nombre: 'Visita Temática', precio: 99, tipo: 'visita' },
    conociendo_medio_ambiente: { nombre: 'Conociendo y conservando el medio ambiente', precio: 125, tipo: 'taller' },
    crea_herbario: { nombre: 'Crea tu herbario', precio: 125, tipo: 'taller' },
    fosiles_plantas: { nombre: 'De fósiles y plantas', precio: 99, tipo: 'taller' },
    detective_botanico: { nombre: 'El detective botánico', precio: 99, tipo: 'taller' },
    horticultura: { nombre: 'Horticultura', precio: 125, tipo: 'taller' },
    insectos: { nombre: 'Insectos', precio: 99, tipo: 'taller' },
    lombricomposta: { nombre: 'Lombricomposta', precio: 125, tipo: 'taller' },
    terrarios: { nombre: 'Terrarios (un mini jardín)', precio: 145, tipo: 'taller' },
    colecta_plantas: { nombre: 'Colecta de plantas', precio: 190, tipo: 'taller' },
    plantas_medicinales: { nombre: 'Plantas medicinales', precio: 190, tipo: 'taller' }
  };

  // Definición del Formulario Reactivo
  solicitudForm = this.fb.group({
    // Datos de la Institución
    escuela: ['', Validators.required],
    calle: ['', Validators.required],
    num_ext: ['', Validators.required],
    num_int: [''],
    colonia: ['', Validators.required],
    cp: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
    municipio: ['', Validators.required],

    // Contacto y Nivel
    profesores: this.fb.array([this.fb.control('', Validators.required)]),
    telefonos: this.fb.array([this.fb.control('', [Validators.required, Validators.pattern(/^\d{10}$/)])]),
    correos: this.fb.array([this.fb.control('', [Validators.required, Validators.email])]),
    nivel: ['', Validators.required],
    grado: ['', Validators.required],

    // Detalles del Servicio
    servicios: this.fb.nonNullable.control<string[]>([], [
      Validators.required,
      this.validarServicios.bind(this)
    ]),
    fecha: ['', Validators.required],
    hora: ['', Validators.required],
    num_grupos: [1, [Validators.required, Validators.min(1)]],
    estudiantes_grupo: [10, [Validators.required, Validators.min(1)]],
    num_maestros: [1, [Validators.required, Validators.min(0)]],
    num_padres: [0, [Validators.required, Validators.min(0)]],
    lunch: ['no', Validators.required],
    notas: [''],

    // Paso 3: Reporte de Pago
    comprobante: [''],
    titular: [''],
    monto_pagar: [''],
    concepto_pago: ['']
  });

  constructor() {
    // Suscribirse a cambios en el formulario para recalcular totales automáticamente
    this.solicitudForm.valueChanges.subscribe(() => {
      this.calcularTotales();
    });

    // Calcular totales iniciales
    this.calcularTotales();

    // Efecto reactivo: cada vez que el usuario está o regresa al Paso 1,
    // se vuelven a inicializar el calendario y el reloj sobre los inputs del DOM
    effect(() => {
      if (this.pasoActual() === 1) {
        setTimeout(() => {
          this.inicializarPickers();
        }, 50);
      }
    });
  }

  ngAfterViewInit(): void {
    this.inicializarPickers();
  }

  ngOnDestroy(): void {
    this.destruirPickers();
  }

  // ============================================================
  // CONFIGURACIÓN DE FLATPICKR (CALENDARIO Y RELOJ)
  // ============================================================
  private destruirPickers(): void {
    if (this.fpFecha) {
      this.fpFecha.destroy();
      this.fpFecha = null;
    }
    if (this.fpHora) {
      this.fpHora.destroy();
      this.fpHora = null;
    }
  }

  private inicializarPickers(): void {
    this.destruirPickers();

    // 1. Inicializar Calendario (Fecha de visita Lun-Vie)
    if (this.fechaInput?.nativeElement) {
      const inputEl = this.fechaInput.nativeElement;

      this.fpFecha = flatpickr(inputEl, {
        locale: Spanish,
        dateFormat: 'Y-m-d',
        minDate: 'today',
        disableMobile: true,
        static: true, // <--- CLAVE: Evita que Flatpickr calcule coordenadas erróneas en la página
        disable: [
          (date: Date) => date.getDay() === 0 || date.getDay() === 6 // Bloquear domingo (0) y sábado (6)
        ],
        defaultDate: this.solicitudForm.controls.fecha.value || undefined,
        onChange: (_selectedDates: Date[], dateStr: string) => {
          this.solicitudForm.controls.fecha.setValue(dateStr);
          this.solicitudForm.controls.fecha.markAsTouched();
        }
      });
    }

    // 2. Inicializar Reloj (Horario 09:00 - 15:00)
    if (this.horaInput?.nativeElement) {
      const inputEl = this.horaInput.nativeElement;

      this.fpHora = flatpickr(inputEl, {
        enableTime: true,
        noCalendar: true,
        dateFormat: 'H:i',
        time_24hr: true,
        minTime: '09:00',
        maxTime: '15:00',
        disableMobile: true,
        static: true, // <--- CLAVE: Lo mantiene anclado exactamente a su input
        defaultDate: this.solicitudForm.controls.hora.value || undefined,
        onChange: (_selectedDates: Date[], dateStr: string) => {
          this.solicitudForm.controls.hora.setValue(dateStr);
          this.solicitudForm.controls.hora.markAsTouched();
        }
      });
    }
  }

  // ============================================================
  // GETTERS Y MANEJO DE FORMARRAYS (PROFESORES, TELÉFONOS, CORREOS)
  // ============================================================
  get profesores(): FormArray<FormControl> {
    return this.solicitudForm.get('profesores') as FormArray<FormControl>;
  }

  get telefonos(): FormArray<FormControl> {
    return this.solicitudForm.get('telefonos') as FormArray<FormControl>;
  }

  get correos(): FormArray<FormControl> {
    return this.solicitudForm.get('correos') as FormArray<FormControl>;
  }

  agregarCampo(tipo: 'profesor' | 'telefono' | 'correo'): void {
    if (tipo === 'profesor') {
      this.profesores.push(this.fb.control('', Validators.required));
    } else if (tipo === 'telefono') {
      this.telefonos.push(this.fb.control('', [Validators.required, Validators.pattern(/^\d{10}$/)]));
    } else if (tipo === 'correo') {
      this.correos.push(this.fb.control('', [Validators.required, Validators.email]));
    }
  }

  eliminarCampo(tipo: 'profesor' | 'telefono' | 'correo', index: number): void {
    if (tipo === 'profesor' && this.profesores.length > 1) {
      this.profesores.removeAt(index);
    } else if (tipo === 'telefono' && this.telefonos.length > 1) {
      this.telefonos.removeAt(index);
    } else if (tipo === 'correo' && this.correos.length > 1) {
      this.correos.removeAt(index);
    }
  }

  // ============================================================
  // VALIDACIÓN Y SELECCIÓN DE SERVICIOS EDUCATIVOS
  // ============================================================
  validarServicios(control: AbstractControl): ValidationErrors | null {
    const seleccionados: string[] = control.value || [];
    if (seleccionados.length === 0) {
      return { required: true };
    }
    if (seleccionados.length > 3) {
      return { maxSelections: true };
    }
    const visitasSeleccionadas = seleccionados.filter(
      (id) => this.catalogoServicios[id]?.tipo === 'visita'
    );
    if (visitasSeleccionadas.length > 1) {
      return { maxVisitas: true };
    }
    return null;
  }

  toggleServicio(servicioId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const actuales = [...this.solicitudForm.controls.servicios.value];

    if (checked) {
      if (!actuales.includes(servicioId)) {
        actuales.push(servicioId);
      }
    } else {
      const idx = actuales.indexOf(servicioId);
      if (idx > -1) {
        actuales.splice(idx, 1);
      }
    }

    this.solicitudForm.controls.servicios.setValue(actuales);
    this.solicitudForm.controls.servicios.markAsTouched();
    this.solicitudForm.controls.servicios.updateValueAndValidity();
  }

  // ============================================================
  // CÁLCULO DE TOTALES Y ANTICIPO
  // ============================================================
  calcularTotales(): void {
    const grupos = Number(this.solicitudForm.controls.num_grupos.value) || 0;
    const alumnosPorGrupo = Number(this.solicitudForm.controls.estudiantes_grupo.value) || 0;
    const padres = Number(this.solicitudForm.controls.num_padres.value) || 0;

    const totalEstudiantes = grupos * alumnosPorGrupo;
    this.totalAlumnos.set(totalEstudiantes);

    // Los docentes acompañantes no pagan; pagan alumnos y padres acompañantes
    const personasQuePagan = totalEstudiantes + padres;

    const serviciosSeleccionados = this.solicitudForm.controls.servicios.value || [];
    const costoPorPersona = serviciosSeleccionados.reduce((acc, id) => {
      return acc + (this.catalogoServicios[id]?.precio || 0);
    }, 0);

    const total = personasQuePagan * costoPorPersona;
    this.montoTotal.set(total);
    this.montoAnticipo.set(total * 0.5);
  }

  // ============================================================
  // ARCHIVO DE COMPROBANTE (PASO 3)
  // ============================================================
  capturarArchivo(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.archivoComprobante = input.files[0];
    }
  }

  // ============================================================
  // NAVEGACIÓN ENTRE PASOS Y ACCIONES FINALES
  // ============================================================
  irAPaso(paso: number): void {
    // Si intenta avanzar del Paso 1, validamos los campos obligatorios del Paso 1
    if (this.pasoActual() === 1 && paso > 1) {
      const controlesPaso1 = [
        this.solicitudForm.controls.escuela,
        this.solicitudForm.controls.calle,
        this.solicitudForm.controls.num_ext,
        this.solicitudForm.controls.colonia,
        this.solicitudForm.controls.cp,
        this.solicitudForm.controls.municipio,
        this.solicitudForm.controls.profesores,
        this.solicitudForm.controls.telefonos,
        this.solicitudForm.controls.correos,
        this.solicitudForm.controls.nivel,
        this.solicitudForm.controls.grado,
        this.solicitudForm.controls.servicios,
        this.solicitudForm.controls.fecha,
        this.solicitudForm.controls.hora
      ];

      controlesPaso1.forEach((ctrl) => ctrl.markAllAsTouched());

      // Si quieres permitir avanzar durante pruebas aunque falten campos, puedes comentar este bloque:
      const invalido = controlesPaso1.some((ctrl) => ctrl.invalid);
      if (invalido) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    // Al llegar al Paso 6 (Resumen), generamos el folio si aún no existe
    if (paso === 6 && !this.folioAsignado()) {
      const anio = new Date().getFullYear();
      const aleatorio = Math.floor(1000 + Math.random() * 9000);
      this.folioAsignado.set(`JB-${anio}-${aleatorio}`);
    }

    this.pasoActual.set(paso);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  regresarACorrecciones(): void {
    this.irAPaso(1);
  }

  salirAlMenu(): void {
    this.router.navigate(['/']);
  }

  descargarPoliticas(): void {
    window.print();
  }

  descargarResumenPDF(): void {
    window.print();
  }
}