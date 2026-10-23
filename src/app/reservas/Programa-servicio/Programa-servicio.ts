import { Component, ChangeDetectionStrategy, inject, computed, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray, FormGroup, AbstractControl } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgOptimizedImage } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProgramaActividadesService, ProgramaServicioData, ProgramaServicioRecord } from './programa-actividades.service';

type TipoBloque = 'tabla' | 'grupo';

@Component({
  selector: 'app-programa-servicio',
  standalone: true,
  imports: [ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './programa-servicio.html',
  styleUrl: './Programa-servicio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgramaServicioComponent implements OnInit {
  private fb = inject(FormBuilder).nonNullable;
  private route = inject(ActivatedRoute);
  private programaStore = inject(ProgramaActividadesService);

  readonly solicitudId = this.route.snapshot.queryParamMap.get('solicitudId');
  readonly puedeGenerar = signal(false);
  readonly modoConsulta = signal(false);
  readonly estadoSolicitud = signal('');

  private regexNombres = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s.,#()–-]+$/;

  // ---------------------------------------------------------------------
  // Formulario principal: Datos Generales + Programa (bloques dinámicos)
  // ---------------------------------------------------------------------
  programaForm = this.fb.group({
    datosGenerales: this.fb.group({
      escuela: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150), Validators.pattern(this.regexNombres)]],
      fecha: ['', Validators.required],
      horaInicio: ['', Validators.required],
      horaTermino: ['', Validators.required],
      gradoEdades: ['', [Validators.required, Validators.maxLength(150)]],
      estudiantes: [null, [Validators.required, Validators.min(0), Validators.max(300)]],
      adultos: [null, [Validators.required, Validators.min(0), Validators.max(60)]],
      secciones: [null, [Validators.required, Validators.min(1), Validators.max(10)]],
      servicioEducativo: ['', Validators.required],
      folio: ['', [Validators.required, Validators.maxLength(20)]]
    }),
    bloques: this.fb.array<FormGroup>([])
  });

  formValues = toSignal(this.programaForm.valueChanges, { initialValue: this.programaForm.getRawValue() });

  totalPersonas = computed(() => {
    const dg = this.formValues().datosGenerales;
    return (dg?.estudiantes || 0) + (dg?.adultos || 0);
  });

  get datosGenerales(): FormGroup {
    return this.programaForm.get('datosGenerales') as FormGroup;
  }

  get bloques(): FormArray {
    return this.programaForm.get('bloques') as FormArray;
  }

  constructor() {
    // Sin bloques precargados - usuario los agrega según sea necesario
  }

  ngOnInit(): void {
    if (!this.solicitudId) return;

    const programaGuardado = this.programaStore.getProgram(this.solicitudId);
    if (programaGuardado) {
      this.cargarProgramaGuardado(programaGuardado);
      return;
    }

    const solicitud = this.programaStore.getContext(this.solicitudId);
    if (!solicitud || solicitud.estado !== 'aprobada') {
      this.programaForm.disable({ emitEvent: false });
      return;
    }

    this.estadoSolicitud.set(solicitud.estado);
    this.puedeGenerar.set(true);
    this.datosGenerales.patchValue({
      escuela: solicitud.escuela,
      fecha: solicitud.fecha,
      horaInicio: solicitud.horaInicio,
      horaTermino: solicitud.horaTermino,
      gradoEdades: solicitud.gradoEdades,
      estudiantes: solicitud.estudiantes,
      adultos: solicitud.adultos,
      secciones: solicitud.secciones,
      servicioEducativo: this.nombreServicios(solicitud.servicios),
      folio: solicitud.folio
    });
    this.agregarBloque('tabla');
  }

  // ---------------------------------------------------------------------
  // Bloques y filas del programa (FormArray anidado)
  // ---------------------------------------------------------------------
  crearFila(horario = '', lugar = '', actividad = '', responsables = ''): FormGroup {
    return this.fb.group({
      horario: [horario, Validators.required],
      lugar: [lugar],
      actividad: [actividad, Validators.required],
      responsables: [responsables]
    });
  }

  crearBloque(tipo: TipoBloque, titulo = '', filas: FormGroup[] = []): FormGroup {
    return this.fb.group({
      tipo: [tipo, Validators.required],
      titulo: [titulo, [Validators.required, Validators.maxLength(120)]],
      filas: this.fb.array(filas.length ? filas : [this.crearFila()])
    });
  }

  getFilas(bloque: AbstractControl): FormArray {
    return bloque.get('filas') as FormArray;
  }

  agregarBloque(tipo: TipoBloque) {
    const titulo = tipo === 'tabla' ? 'Nuevo bloque de actividades' : 'Grupo: ';
    this.bloques.push(this.crearBloque(tipo, titulo));
  }

  eliminarBloque(index: number) {
    if (this.bloques.length > 1) this.bloques.removeAt(index);
  }

  agregarFila(bloqueIndex: number) {
    this.getFilas(this.bloques.at(bloqueIndex) as FormGroup).push(this.crearFila());
  }

  eliminarFila(bloqueIndex: number, filaIndex: number) {
    const filas = this.getFilas(this.bloques.at(bloqueIndex) as FormGroup);
    if (filas.length > 1) filas.removeAt(filaIndex);
  }

  moverBloque(index: number, direccion: -1 | 1) {
    const destino = index + direccion;
    if (destino < 0 || destino >= this.bloques.length) return;
    const control = this.bloques.at(index);
    this.bloques.removeAt(index);
    this.bloques.insert(destino, control);
  }

  // ---------------------------------------------------------------------
  // Acciones
  // ---------------------------------------------------------------------
  imprimirPrograma() {
    window.print();
  }

  descargarProgramaPDF() {
    if (this.solicitudId && this.modoConsulta()) {
      if (!this.programaStore.downloadSavedPdf(this.solicitudId)) {
        alert('No se encontró el PDF guardado para esta solicitud.');
      }
      return;
    }

    if (this.solicitudId && !this.puedeGenerar()) {
      alert('El programa solo puede generarse para una solicitud aprobada.');
      return;
    }

    if (this.programaForm.invalid) {
      this.programaForm.markAllAsTouched();
      alert('Revisa los campos marcados: hay datos incompletos en el Programa para Actividades de Servicio.');
      return;
    }

    const doc = new jsPDF();
    const dg = this.datosGenerales.getRawValue();

    doc.setFillColor(143, 186, 66);
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.text('JARDÍN BOTÁNICO UNIVERSITARIO BUAP', 14, 11);
    doc.setFontSize(10);
    doc.text('Área de Educación y Divulgación · Programa para Actividades de Servicio', 14, 18);

    doc.setTextColor(44, 62, 80);
    autoTable(doc, {
      startY: 32,
      theme: 'grid',
      headStyles: { fillColor: [27, 55, 31] },
      head: [['Datos Generales', '']],
      body: [
        ['Escuela', dg.escuela],
        ['Fecha', dg.fecha],
        ['Horario', `${dg.horaInicio} - ${dg.horaTermino}`],
        ['Grado escolar o edades', dg.gradoEdades],
        ['Estudiantes', String(dg.estudiantes)],
        ['Adultos / Maestros', String(dg.adultos)],
        ['Secciones a dividir el grupo', String(dg.secciones)],
        ['Servicio educativo', dg.servicioEducativo],
        ['Folio', dg.folio]
      ]
    });

    let cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    this.bloques.controls.forEach((bloque) => {
      const tipo = bloque.get('tipo')?.value as TipoBloque;
      const titulo = bloque.get('titulo')?.value as string;
      const filas = (bloque.get('filas') as FormArray).controls;

      if (cursorY > 260) {
        doc.addPage();
        cursorY = 20;
      }

      doc.setFontSize(11);
      doc.setTextColor(20, 90, 50);
      doc.text(titulo, 14, cursorY);

      const head = tipo === 'tabla' ? [['Horario', 'Lugar', 'Actividad']] : [['Horario', 'Actividad / Responsable(s)']];
      const body = filas.map((f) => {
        const v = f.value;
        return tipo === 'tabla'
          ? [v.horario, v.lugar, v.actividad]
          : [v.horario, v.responsables ? `${v.actividad}\n${v.responsables}` : v.actividad];
      });

      autoTable(doc, {
        startY: cursorY + 3,
        theme: 'grid',
        headStyles: { fillColor: [143, 186, 66] },
        head,
        body
      });

      cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    });

    if (this.solicitudId) {
      const result = this.programaStore.saveProgram(
        this.solicitudId,
        this.estadoSolicitud(),
        this.programaForm.getRawValue() as ProgramaServicioData,
        doc.output('datauristring')
      );

      if (result !== 'guardado') {
        if (result === 'ya-generado') {
          const existing = this.programaStore.getProgram(this.solicitudId);
          if (existing) this.cargarProgramaGuardado(existing);
        }
        alert(result === 'ya-generado'
          ? 'El programa de esta solicitud ya fue generado. Se abrió en modo consulta.'
          : 'No fue posible guardar el programa. Verifica que la solicitud continúe aprobada.');
        return;
      }

      this.modoConsulta.set(true);
      this.puedeGenerar.set(false);
      this.programaForm.disable({ emitEvent: false });
    }

    doc.save(`Programa_Servicio_${dg.folio || this.solicitudId || 'sf'}.pdf`);
  }

  private cargarProgramaGuardado(record: ProgramaServicioRecord): void {
    this.estadoSolicitud.set(record.estado);
    this.datosGenerales.patchValue(record.programa.datosGenerales, { emitEvent: false });
    this.bloques.clear({ emitEvent: false });

    for (const bloque of record.programa.bloques) {
      const filas = bloque.filas.map(fila =>
        this.crearFila(fila.horario, fila.lugar, fila.actividad, fila.responsables)
      );
      this.bloques.push(this.crearBloque(bloque.tipo, bloque.titulo, filas), { emitEvent: false });
    }

    this.modoConsulta.set(true);
    this.puedeGenerar.set(false);
    this.programaForm.disable({ emitEvent: false });
  }

  private nombreServicios(servicios: string[]): string {
    const nombres: Record<string, string> = {
      visita_guiada: 'Visita guiada',
      visita_tematica: 'Visita temática',
      conociendo_medio_ambiente: 'Conociendo el medio ambiente',
      crea_herbario: 'Crea tu herbario',
      fosiles_plantas: 'De fósiles y plantas',
      detective_botanico: 'Detective botánico',
      horticultura: 'Horticultura',
      insectos: 'Insectos',
      lombricomposta: 'Lombricomposta',
      terrarios: 'Terrarios',
      colecta_plantas: 'Colecta de plantas',
      plantas_medicinales: 'Plantas medicinales'
    };

    return servicios.map(servicio => nombres[servicio] ?? servicio).join(', ');
  }
}
