import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [HeaderComponent, RouterOutlet],
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
    this.router.navigate(['/consultar-solicitud']);
  }

  irALogin(): void {
    this.router.navigate(['/login']);
  }
}