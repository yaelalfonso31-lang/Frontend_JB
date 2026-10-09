import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
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
  diaSeleccionado = signal<Date | null>(new Date());
  visitas = signal<VisitaCalendario[]>([]);

  mesAnioActual = computed(() => {
    const fecha = this.fechaActual();
    const mes = fecha.toLocaleString('es-MX', { month: 'long' });
    return `${mes.charAt(0).toUpperCase() + mes.slice(1)} ${fecha.getFullYear()}`;
  });

  diasDelMes = computed(() => {
    const fecha = this.fechaActual();
    const primerDia = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
    const ultimoDia = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
    const dias: (Date | null)[] = [];

    for (let i = 0; i < primerDia.getDay(); i++) {
      dias.push(null);
    }

    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      dias.push(new Date(fecha.getFullYear(), fecha.getMonth(), dia));
    }

    return dias;
  });

  visitasDelDia = computed(() => {
    const dia = this.diaSeleccionado();
    if (!dia) {
      return [];
    }

    const fecha = this.formatearFecha(dia);
    return this.visitas().filter((visita) => visita.fechaVisita === fecha);
  });

  ngOnInit(): void {
    this.cargarVisitas();
  }

  cargarVisitas(): void {
    this.http.get<VisitaCalendario[]>('/api/calendario/aprobadas').subscribe({
      next: (data) => this.visitas.set(data),
      error: (error) => console.error('Error al cargar calendario administrativo:', error)
    });
  }

  cambiarMes(delta: number): void {
    const actual = this.fechaActual();
    this.fechaActual.set(new Date(actual.getFullYear(), actual.getMonth() + delta, 1));
    this.diaSeleccionado.set(null);
  }

  seleccionarDia(dia: Date | null): void {
    if (dia) {
      this.diaSeleccionado.set(dia);
    }
  }

  esDiaSeleccionado(dia: Date | null): boolean {
    const seleccionado = this.diaSeleccionado();
    return !!dia && !!seleccionado && dia.getTime() === seleccionado.getTime();
  }

  tieneVisitas(dia: Date | null): boolean {
    return !!dia && this.visitas().some((visita) => visita.fechaVisita === this.formatearFecha(dia));
  }

  private formatearFecha(fecha: Date): string {
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mes}-${dia}`;
  }
}
