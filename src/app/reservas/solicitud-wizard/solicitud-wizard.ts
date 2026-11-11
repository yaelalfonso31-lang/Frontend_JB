import { Component, ChangeDetectionStrategy, inject, signal, computed, AfterViewInit, OnInit, ElementRef, viewChild, effect } from '@angular/core';
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

  constructor() {
    // 1. Sincronizar automáticamente el nombre de la escuela con el campo titular del pago
    this.solicitudForm.controls.escuela.valueChanges.subscribe((nombreEscuela) => {
      this.solicitudForm.controls.titular.setValue(nombreEscuela ?? '', { emitEvent: false });
    });

    // 2. Actualizar automáticamente el monto_pagar con el 50% de anticipo (o montoTotal) y mantenerlo bloqueado
    effect(() => {
      const anticipo = this.montoAnticipo();
      this.solicitudForm.controls.monto_pagar.setValue(anticipo.toFixed(2), { emitEvent: false });
    });
  }

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
            services: formVal.servicios,
            status: 'pendiente'
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
    const raw = this.solicitudForm.getRawValue();
    const folio = this.folioAsignado() || 'SIN-FOLIO';

    // Encabezado Institucional
    doc.setFillColor(24, 53, 36); // Verde oscuro institucional
    doc.rect(0, 0, 210, 32, 'F');
    doc.setFillColor(143, 186, 66); // Franja verde claro
    doc.rect(0, 32, 210, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('JARDÍN BOTÁNICO UNIVERSITARIO BUAP', 14, 14);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('ÁREA DE EDUCACIÓN Y DIVULGACIÓN · ACUSE DE SOLICITUD DE VISITA', 14, 22);

    // Caja de Folio a la derecha
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(145, 7, 51, 18, 2, 2, 'F');
    doc.setTextColor(24, 53, 36);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('FOLIO DE SEGUIMIENTO', 170.5, 13, { align: 'center' });
    doc.setFontSize(12);
    doc.setTextColor(30, 132, 69);
    doc.text(folio, 170.5, 21, { align: 'center' });

    // Fecha de emisión
    doc.setTextColor(90, 90, 90);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}`, 14, 42);

    // Tabla 1: Datos de la Institución y Contacto
    const direccionCompleta = `${raw.calle} #${raw.num_ext}${raw.num_int ? ' Int. ' + raw.num_int : ''}, Col. ${raw.colonia}, C.P. ${raw.cp}, ${raw.municipio}`;
    autoTable(doc, {
      startY: 46,
      theme: 'grid',
      headStyles: { fillColor: [24, 53, 36], textColor: 255, fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 9, textColor: [44, 62, 80], cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold', fillColor: [244, 246, 246] } },
      head: [['1. DATOS DE LA INSTITUCIÓN Y CONTACTO', '']],
      body: [
        ['Institución / Escuela', raw.escuela || '—'],
        ['Nivel y Grado / Carrera', `${(raw.nivel || '').toUpperCase()} - ${raw.grado || ''}`],
        ['Dirección', direccionCompleta],
        ['Profesor(es) Responsable(s)', (raw.profesores || []).filter(Boolean).join(', ')],
        ['Teléfono(s) de Contacto', (raw.telefonos || []).filter(Boolean).join(', ')],
        ['Correo(s) Electrónico(s)', (raw.correos || []).filter(Boolean).join(', ')]
      ]
    });

    let currentY = (doc as any).lastAutoTable.finalY + 8;

    // Tabla 2: Detalles de la Visita y Asistentes
    const nombresServicios: Record<string, string> = {
      visita_guiada: 'Visita Guiada ($30.00 MXN)',
      visita_tematica: 'Visita Temática ($99.00 MXN)',
      conociendo_medio_ambiente: 'Taller: Conociendo y conservando el medio ambiente ($125.00 MXN)',
      crea_herbario: 'Taller: Crea tu herbario ($125.00 MXN)',
      fosiles_plantas: 'Taller: De fósiles y plantas ($99.00 MXN)',
      detective_botanico: 'Taller: El detective botánico ($99.00 MXN)',
      horticultura: 'Taller: Horticultura ($125.00 MXN)',
      insectos: 'Taller: Insectos ($99.00 MXN)',
      lombricomposta: 'Taller: Lombricomposta ($125.00 MXN)',
      terrarios: 'Taller: Terrarios ($145.00 MXN)',
      colecta_plantas: 'Taller Especial: Colecta de plantas ($190.00 MXN)',
      plantas_medicinales: 'Taller Especial: Plantas medicinales ($190.00 MXN)'
    };

    const listaServicios = (raw.servicios || []).map((s: string) => `• ${nombresServicios[s] || s}`).join('\n') || 'Ninguno seleccionado';

    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      headStyles: { fillColor: [64, 133, 88], textColor: 255, fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 9, textColor: [44, 62, 80], cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold', fillColor: [244, 246, 246] } },
      head: [['2. DETALLES DEL SERVICIO Y ASISTENCIA', '']],
      body: [
        ['Fecha y Hora Solicitada', `${raw.fecha} a las ${raw.hora} hrs`],
        ['Servicios Seleccionados', listaServicios],
        ['Distribución de Grupos', `${raw.num_grupos} grupo(s) × ${raw.estudiantes_grupo} alumnos por grupo`],
        ['Total de Alumnos', `${this.totalAlumnos()} alumnos`],
        ['Acompañantes', `${raw.num_maestros} maestro(s) (sin costo) y ${raw.num_padres} padre(s) de familia`],
        ['¿Tomarán lunch en el jardín?', raw.lunch === 'si' ? 'Sí' : 'No'],
        ['Notas Adicionales', raw.notas || 'Sin comentarios adicionales']
      ]
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // Tabla 3: Resumen Financiero y Pago
    const formatoMoneda = (val: number) => val.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      headStyles: { fillColor: [24, 53, 36], textColor: 255, fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 9, textColor: [44, 62, 80], cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold', fillColor: [244, 246, 246] } },
      head: [['3. RESUMEN DE PAGO Y DATOS BANCARIOS', '']],
      body: [
        ['Titular / Institución', raw.titular || raw.escuela || '—'],
        ['Concepto de Pago', raw.concepto_pago || '—'],
        ['Monto Total Estimado', formatoMoneda(this.montoTotal())],
        ['Anticipo Requerido (50%)', formatoMoneda(this.montoAnticipo())],
        ['Datos Bancarios HSBC', 'Herbario y Jardín Botánico BUAP | Cuenta: 4016001638 | CLABE: 021650040160016381'],
        ['Envío de Comprobantes', 'jardinbotanico.cfdi@correo.buap.mx']
      ]
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // Aviso importante al pie
    doc.setFillColor(209, 231, 222);
    doc.roundedRect(14, currentY, 182, 20, 2, 2, 'F');
    doc.setTextColor(24, 53, 36);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('IMPORTANTE:', 18, currentY + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'Conserve este documento y su número de folio para consultar el estado de su solicitud en la plataforma.\nDudas o cancelaciones: Tel. 222 229 5500 ext. 7033, 7032, 7034 | WhatsApp: +52 222 529 7312.',
      18,
      currentY + 12
    );

    doc.save(`Acuse_Solicitud_${folio}.pdf`);
  }

  descargarPoliticas(): void {
    const doc = new jsPDF();
    const folio = this.folioAsignado() || 'PRE-REGISTRO';

    // Encabezado Institucional
    doc.setFillColor(24, 53, 36);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setFillColor(143, 186, 66);
    doc.rect(0, 28, 210, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('JARDÍN BOTÁNICO UNIVERSITARIO BUAP', 14, 13);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('POLÍTICAS DE SERVICIO, CÓDIGO DE COMPORTAMIENTO Y RECOMENDACIONES', 14, 21);

    // 1. Políticas de Servicio y Pagos
    autoTable(doc, {
      startY: 36,
      theme: 'grid',
      headStyles: { fillColor: [24, 53, 36], textColor: 255, fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 8.5, textColor: [44, 62, 80], cellPadding: 2.5 },
      columnStyles: { 0: { cellWidth: 48, fontStyle: 'bold', fillColor: [244, 246, 246] } },
      head: [['1. POLÍTICAS DE SERVICIO E INFORMACIÓN DE PAGO', '']],
      body: [
        ['Confirmación Previa', 'No realice ningún pago hasta recibir la confirmación de disponibilidad y horario por parte del área correspondiente.'],
        ['Cambios en Reservación', 'Si realiza cambios, envíe nuevamente el formato actualizado al mismo correo y asegúrese de recibir autorización.'],
        ['Puntualidad', 'Llegar a tiempo a su visita. Los minutos de retraso se descontarán del tiempo total de su servicio.'],
        ['Política Antisoborno BUAP', 'Queda estrictamente prohibido ofrecer propinas, regalos u obsequios de cualquier tipo al personal del Jardín Botánico.'],
        ['Plazos de Pago', '• Anticipo del 50%: mínimo una semana antes de su visita.\n• Pago del 50% restante: mínimo dos días hábiles antes de su visita.'],
        ['Cuenta Bancaria HSBC', 'A nombre de: Herbario y Jardín Botánico BUAP\nNo. de cuenta: 4016001638 | CLABE Interbancaria (CI): 021650040160016381'],
        ['Facturación y Comprobantes', 'Enviar comprobante a: jardinbotanico.cfdi@correo.buap.mx. Si requiere factura, adjunte Constancia de Situación Fiscal y uso de CFDI.']
      ]
    });

    let currentY = (doc as any).lastAutoTable.finalY + 6;

    // 2. Código de Comportamiento
    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      headStyles: { fillColor: [220, 53, 69], textColor: 255, fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 8.5, textColor: [44, 62, 80], cellPadding: 2.5 },
      head: [['2. CÓDIGO DE COMPORTAMIENTO — NO ESTÁ PERMITIDO', 'OBLIGACIONES DEL VISITANTE']],
      body: [
        [
          '• Llevarse semillas, etiquetas y/o partes de plantas.\n' +
          '• Dañar las plantas (pisar, rayonear, arrancar flores, frutos u hojas).\n' +
          '• Entrar con mascotas, bicicletas o balones.\n' +
          '• Pescar o arrojar objetos al lago.\n' +
          '• Hacer fogatas, picnics, fumar o ingresar con bebidas alcohólicas.\n' +
          '• Ingresar con radios/grabadoras o tomar fotos con fines comerciales.\n' +
          '• Alimentar a las aves y otros animales silvestres.',
          '• Depositar la basura en los contenedores o llevarla consigo.\n\n' +
          '• Caminar únicamente por los senderos de adoquín y senderos secundarios que indique el guía.\n\n' +
          '• Respetar en todo momento al guía y/o facilitador.\n\n' +
          '• Profesor responsable: Deberá acompañar a su grupo durante todas las actividades y es responsable del comportamiento del mismo.\n\n' +
          '• SEGURIDAD: Prohibido ingresar al lago bajo ninguna circunstancia.'
        ]
      ]
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;

    // 3. Recomendaciones
    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      headStyles: { fillColor: [64, 133, 88], textColor: 255, fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 8.5, textColor: [44, 62, 80], cellPadding: 2.5 },
      columnStyles: { 0: { cellWidth: 48, fontStyle: 'bold', fillColor: [244, 246, 246] } },
      head: [['3. RECOMENDACIONES PARA SU VISITA', '']],
      body: [
        ['Preparación e Identificación', 'Comparta el programa y código de comportamiento con el grupo. Cada visitante deberá portar gafete o etiqueta visible con su nombre.'],
        ['Comodidad y Clima', 'Usar ropa cómoda, calzado adecuado para senderos, bloqueador solar y repelente. Prever impermeable/sombrilla o gorra según el clima.'],
        ['Sustentabilidad', 'Traer lunches nutritivos evitando ultraprocesados. Cada integrante es responsable del manejo de sus residuos.'],
        ['Acceso y Estacionamiento', 'Autobuses y camionetas: ingresar por Puerta 1 (24 Sur y Av. San Claudio, junto a gasolinera). Estacionamiento asignado en el Estadio Universitario.'],
        ['Inclusión', 'Informar con antelación si algún integrante tiene necesidades específicas de movilidad o comunicación.']
      ]
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Documento informativo oficial del Jardín Botánico Universitario BUAP · Folio asociado: ${folio} · Tel: 222 229 5500 ext. 7033`,
      105,
      currentY,
      { align: 'center' }
    );

    doc.save(`Politicas_y_Reglamento_JBUAP_${folio}.pdf`);
  }

  evitarNegativos(event: KeyboardEvent): void {
    if (['-', '+', 'e', 'E', '.'].includes(event.key)) {
      event.preventDefault();
    }
  }

  sanitizarPositivo(campo: 'num_grupos' | 'estudiantes_grupo' | 'num_maestros' | 'num_padres', minimo: number): void {
    const control = this.solicitudForm.controls[campo];
    const valor = Number(control.value);
    if (isNaN(valor) || valor < minimo) {
      control.setValue(minimo);
    } else if (!Number.isInteger(valor)) {
      control.setValue(Math.floor(valor));
    }
  }
}