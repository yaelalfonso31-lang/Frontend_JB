import { Component, ChangeDetectionStrategy, inject, computed, AfterViewInit, ElementRef, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray, FormGroup, AbstractControl } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgOptimizedImage } from '@angular/common';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type TipoBloque = 'tabla' | 'grupo';

@Component({
  selector: 'app-programa-servicio',
  standalone: true,
  imports: [ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './programa-servicio.html',
  styleUrl: './Programa-servicio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgramaServicioComponent implements AfterViewInit {
  private fb = inject(FormBuilder).nonNullable;

  fechaInput = viewChild<ElementRef>('fechaInput');
  horaInicioInput = viewChild<ElementRef>('horaInicioInput');
  horaTerminoInput = viewChild<ElementRef>('horaTerminoInput');

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

  ngAfterViewInit() {
    if (this.fechaInput()?.nativeElement) {
      flatpickr(this.fechaInput()!.nativeElement, {
        locale: Spanish,
        disable: [(date) => date.getDay() === 0 || date.getDay() === 6]
      });
    }

    const configHora = {
      enableTime: true,
      noCalendar: true,
      dateFormat: 'H:i',
      minTime: '09:00',
      maxTime: '15:00',
      time_24hr: true,
      minuteIncrement: 5,
      disableMobile: true
    };

    if (this.horaInicioInput()?.nativeElement) {
      flatpickr(this.horaInicioInput()!.nativeElement, configHora);
    }
    if (this.horaTerminoInput()?.nativeElement) {
      flatpickr(this.horaTerminoInput()!.nativeElement, configHora);
    }
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

    doc.save(`Programa_Servicio_${dg.folio || 'sf'}.pdf`);
  }
}
