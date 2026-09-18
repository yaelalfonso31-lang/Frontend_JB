import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface VisitaCalendario {
  id: number;
  solicitante: string;
  escuela: string;
  fechaVisita: string;
  horaVisita: string;
  numeroVisitantes: number;
  estado: string;
}

@Component({
  selector: 'app-colaborador-calendario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendario.html',
  styleUrl: './calendario.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Calendario implements OnInit {
  private http = inject(HttpClient);

  // Estados principales
  fechaActual = signal<Date>(new Date());
  diaSeleccionado = signal<Date | null>(new Date()); // Por defecto seleccionamos el día de hoy
  visitas = signal<VisitaCalendario[]>([]);

  // --- SECCIÓN COMPUTADA (Se actualiza sola cuando los datos cambian) ---

  // Título del mes y año (Ej: "Septiembre 2026")
  mesAnioActual = computed(() => {
    const fecha = this.fechaActual();
    const mes = fecha.toLocaleString('es-MX', { month: 'long' });
    return `${mes.charAt(0).toUpperCase() + mes.slice(1)} ${fecha.getFullYear()}`;
  });

  // Generador de la cuadrícula del mes
  diasDelMes = computed(() => {
    const fecha = this.fechaActual();
    const anio = fecha.getFullYear();
    const mes = fecha.getMonth();

    const primerDia = new Date(anio, mes, 1);
    const ultimoDia = new Date(anio, mes + 1, 0);

    const dias: (Date | null)[] = [];
    
    // Rellenar los huecos vacíos antes del día 1 (Domingo a Sábado)
    for (let i = 0; i < primerDia.getDay(); i++) {
      dias.push(null);
    }
    // Rellenar los números del mes
    for (let i = 1; i <= ultimoDia.getDate(); i++) {
      dias.push(new Date(anio, mes, i));
    }
    return dias;
  });

  // Filtra las visitas para que la tabla solo muestre las del día seleccionado
  visitasDelDia = computed(() => {
    const dia = this.diaSeleccionado();
    if (!dia) return [];

    const formato = this.formatearFechaBD(dia);
    return this.visitas().filter(v => v.fechaVisita === formato);
  });

  // --- MÉTODOS Y FUNCIONES ---

  ngOnInit(): void {
    this.cargarVisitas();
  }

  cargarVisitas() {
    this.http.get<VisitaCalendario[]>('/api/calendario/aprobadas').subscribe({
      next: (data) => this.visitas.set(data),
      error: (err) => console.error('Error al cargar calendario:', err)
    });
  }

  cambiarMes(delta: number) {
    const actual = this.fechaActual();
    this.fechaActual.set(new Date(actual.getFullYear(), actual.getMonth() + delta, 1));
    this.diaSeleccionado.set(null); // Borra la selección al cambiar de mes
  }

  seleccionarDia(dia: Date | null) {
    if (dia) this.diaSeleccionado.set(dia);
  }

  esDiaSeleccionado(dia: Date | null): boolean {
    if (!dia || !this.diaSeleccionado()) return false;
    return dia.getTime() === this.diaSeleccionado()!.getTime();
  }

  tieneVisitas(dia: Date | null): boolean {
    if (!dia) return false;
    const formato = this.formatearFechaBD(dia);
    return this.visitas().some(v => v.fechaVisita === formato);
  }

  // Convierte la fecha del navegador a texto "YYYY-MM-DD" para poder compararla con la base de datos
  private formatearFechaBD(fecha: Date): string {
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    const dd = String(fecha.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}