import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [NgOptimizedImage],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InicioComponent {
  private router = inject(Router);

  irASolicitud(): void {
    this.router.navigate(['/solicitud-visita']);
  }

  irAEstadoSolicitud(): void {
    // Esta ruta la crearemos más adelante
    this.router.navigate(['/estado-solicitud']);
  }

  irALogin(): void {
    this.router.navigate(['/login']);
  }
}