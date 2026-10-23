import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

export interface VisitaCalendario {
  id: number;
  solicitante: string;
  escuela: string;
  fechaVisita: string;
  horaVisita: string;
  numeroVisitantes: number;
  estado: string;
  proposito?: string;
}

export interface DiaSemana {
  fecha: Date;
  fechaISO: string;
  numero: number;
  nombre: string;
}

@Component({
  selector: 'app-administrador-calendario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendario.html',
  styleUrl: './calendario.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdministradorCalendarioComponent implements OnInit {
  private http = inject(HttpClient);

  fechaActual = signal(new Date());
  diaSeleccionado = signal<Date>(new Date());
  visitas = signal<VisitaCalendario[]>([]);
  visitaSeleccionada = signal<VisitaCalendario | null>(null);

  private readonly horasBase = [
    '09:00', '10:00', '11:00', '12:30', '13:30', '14:30', '15:30', '16:30'
  ];

  mesAnioActual = computed(() => {
    const fecha = this.fechaActual();
    const mes = fecha.toLocaleString('es-MX', { month: 'long' });
    return `${mes.toUpperCase()} ${fecha.getFullYear()}`;
  });

  /* Mini-calendario alineado de Lunes (L) a Domingo (D) como en el PDF */
  diasDelMes = computed(() => {
    const fecha = this.fechaActual();
    const primerDia = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
    const ultimoDia = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
    const dias: (Date | null)[] = [];

    const offsetLunes = (primerDia.getDay() + 6) % 7;
    for (let i = 0; i < offsetLunes; i++) {
      dias.push(null);
    }

    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      dias.push(new Date(fecha.getFullYear(), fecha.getMonth(), dia));
    }

    return dias;
  });

  /* Calcula los 7 días (Lunes a Domingo) de la semana activa */
  diasSemanaActual = computed<DiaSemana[]>(() => {
    const ref = this.diaSeleccionado();
    const day = ref.getDay();
    const diffLunes = day === 0 ? -6 : 1 - day;
    const lunes = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + diffLunes);

    const nombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    return nombres.map((nombre, index) => {
      const fecha = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + index);
      return {
        fecha,
        fechaISO: this.formatearFecha(fecha),
        numero: fecha.getDate(),
        nombre
      };
    });
  });

  rangoSemanaTexto = computed(() => {
    const semana = this.diasSemanaActual();
    if (!semana.length) return '';
    const inicio = semana[0].fecha;
    const fin = semana[6].fecha;
    const mesInicio = inicio.toLocaleString('es-MX', { month: 'short' });
    const mesFin = fin.toLocaleString('es-MX', { month: 'short' });

    return inicio.getMonth() === fin.getMonth()
      ? `${inicio.getDate()} – ${fin.getDate()} de ${mesInicio} ${fin.getFullYear()}`
      : `${inicio.getDate()} ${mesInicio} – ${fin.getDate()} ${mesFin} ${fin.getFullYear()}`;
  });

  /* Combina las horas base del jardín con cualquier hora existente en la BD */
  horasAgenda = computed(() => {
    const setHoras = new Set<string>(this.horasBase);
    for (const v of this.visitas()) {
      const horaLimpia = this.normalizarHora(v.horaVisita);
      if (horaLimpia) setHoras.add(horaLimpia);
    }
    return Array.from(setHoras).sort();
  });

  ngOnInit(): void {
    this.cargarVisitas();
  }

  cargarVisitas(): void {
    this.http.get<VisitaCalendario[]>('/api/calendario/aprobadas').subscribe({
      next: (data) => {
        this.visitas.set(data);
        const hoyISO = this.formatearFecha(this.diaSeleccionado());
        const primeraHoy = data.find(v => v.fechaVisita === hoyISO) || data[0] || null;
        this.visitaSeleccionada.set(primeraHoy);
      },
      error: (error) => console.error('Error al cargar calendario administrativo:', error)
    });
  }

  cambiarMes(delta: number): void {
    const actual = this.fechaActual();
    const nuevoMes = new Date(actual.getFullYear(), actual.getMonth() + delta, 1);
    this.fechaActual.set(nuevoMes);
    this.seleccionarDia(nuevoMes);
  }

  cambiarSemana(deltaSemanas: number): void {
    const actual = this.diaSeleccionado();
    const nuevaFecha = new Date(actual.getFullYear(), actual.getMonth(), actual.getDate() + deltaSemanas * 7);
    this.seleccionarDia(nuevaFecha);
  }

  irAHoy(): void {
    const hoy = new Date();
    this.seleccionarDia(hoy);
  }

  seleccionarDia(dia: Date | null): void {
    if (!dia) return;
    this.diaSeleccionado.set(dia);
    this.fechaActual.set(new Date(dia.getFullYear(), dia.getMonth(), 1));

    const fechaISO = this.formatearFecha(dia);
    const visitaDelDia = this.visitas().find(v => v.fechaVisita === fechaISO) || null;
    this.visitaSeleccionada.set(visitaDelDia);
  }

  seleccionarVisita(visita: VisitaCalendario, event?: Event): void {
    event?.stopPropagation();
    this.visitaSeleccionada.set(visita);
    const [anio, mes, dia] = visita.fechaVisita.split('-').map(Number);
    if (anio && mes && dia) {
      this.diaSeleccionado.set(new Date(anio, mes - 1, dia));
    }
  }

  obtenerVisitasEnCelda(fechaISO: string, horaSlot: string): VisitaCalendario[] {
    return this.visitas().filter(
      (v) => v.fechaVisita === fechaISO && this.normalizarHora(v.horaVisita) === horaSlot
    );
  }

  formatearRangoHora(hora: string): string {
    const limpia = this.normalizarHora(hora);
    if (!limpia) return 'Horario por confirmar';
    const [hh, mm] = limpia.split(':').map(Number);
    const finHora = Math.min(hh + 1, 23);
    const finMin = mm === 30 ? '00' : String(mm).padStart(2, '0');
    const horaFinAjustada = mm === 30 ? Math.min(hh + 2, 23) : finHora;
    return `${limpia} - ${String(horaFinAjustada).padStart(2, '0')}:${finMin}`;
  }

  esDiaSeleccionado(dia: Date | null): boolean {
    const sel = this.diaSeleccionado();
    return !!dia &&
      dia.getDate() === sel.getDate() &&
      dia.getMonth() === sel.getMonth() &&
      dia.getFullYear() === sel.getFullYear();
  }

  esHoy(dia: Date | null): boolean {
    if (!dia) return false;
    const hoy = new Date();
    return dia.getDate() === hoy.getDate() &&
      dia.getMonth() === hoy.getMonth() &&
      dia.getFullYear() === hoy.getFullYear();
  }

  tieneVisitas(dia: Date | null): boolean {
    return !!dia && this.visitas().some((v) => v.fechaVisita === this.formatearFecha(dia));
  }

  private normalizarHora(hora: string): string {
    if (!hora) return '09:00';
    const match = hora.trim().match(/^(\d{1,2}):(\d{2})/);
    if (!match) return '09:00';
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }

  private formatearFecha(fecha: Date): string {
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mes}-${dia}`;
  }
}