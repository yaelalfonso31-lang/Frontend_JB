import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);

  // Convertimos las métricas en un signal inicializado en 0
  metrics = signal({
    solicitudesMes: 0,
    solicitudesAprobadas: 0,
    solicitudesPendientes: 0,
    colaboradoresActivos: 0
  });

  ngOnInit(): void {
    this.cargarMetricas();
  }

  cargarMetricas(): void {
    this.http.get<any>('/api/dashboard/metricas').subscribe({
      next: (data) => {
        // Actualizamos el signal con los datos reales de MariaDB
        this.metrics.set({
          solicitudesMes: data.solicitudesMes || 0,
          solicitudesAprobadas: data.solicitudesAprobadas || 0,
          solicitudesPendientes: data.solicitudesPendientes || 0,
          colaboradoresActivos: data.colaboradoresActivos || 0
        });
      },
      error: (err) => {
        console.error('Error al conectar con la base de datos:', err);
      }
    });
  }
}