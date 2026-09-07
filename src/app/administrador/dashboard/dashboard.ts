import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  // Datos de métricas rápidas
  metrics = {
    solicitudesMes: 45,
    solicitudesAprobadas: 32,
    solicitudesPendientes: 8,
    colaboradoresActivos: 12
  };
}
