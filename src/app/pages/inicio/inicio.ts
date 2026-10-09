import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [HeaderComponent, FooterComponent],
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