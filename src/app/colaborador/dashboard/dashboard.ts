import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';

interface TareaAsignada {
  id: number;
  solicitante: string;
  escuela: string;
  fechaVisita: string;
  horaVisita: string;
  estado: string;
  numeroVisitantes: number;
}

@Component({
  selector: 'app-colaborador-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss', // Hereda los estilos base o los del admin-dashboard si gustas copiarlo
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Dashboard implements OnInit {
  private http = inject(HttpClient);

  // Estadísticas del colaborador
  totalPendientes = signal<number>(0);
  visitasHoy = signal<number>(0);
  totalAsignadas = signal<number>(0);
  
  // Lista de solicitudes/tareas asignadas a este colaborador
  tareasAsignadas = signal<TareaAsignada[]>([]);

  ngOnInit(): void {
    this.cargarDatosDashboard();
  }

  cargarDatosDashboard() {
    // Llamada a la API para obtener las tareas y métricas del colaborador
    // (Podemos apuntar a un endpoint específico o filtrar las del monitor)
    this.http.get<any>('/api/colaborador/resumen').subscribe({
      next: (data) => {
        this.totalPendientes.set(data.pendientes ?? 3);
        this.visitasHoy.set(data.visitasHoy ?? 1);
        this.totalAsignadas.set(data.totalAsignadas ?? 9);
        this.tareasAsignadas.set(data.tareas ?? []);
      },
      error: (err) => {
        console.warn('Usando datos de respaldo o API en desarrollo:', err);
        // Datos de respaldo visuales mientras conectas el endpoint final en Python
        this.totalPendientes.set(0);
        this.visitasHoy.set(0);
        this.totalAsignadas.set(0);
      }
    });
  }
}