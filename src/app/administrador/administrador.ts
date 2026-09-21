import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, ActivatedRoute, Router } from '@angular/router';

type AdminSection = 'dashboard' | 'colaboradores' | 'solicitudes' | 'configuracion';

@Component({
  selector: 'app-administrador',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './administrador.html',
  styleUrl: './administrador.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdministradorComponent implements OnInit {
  activeSection: AdminSection = 'dashboard';
  private router = inject(Router);

  constructor(private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.activatedRoute.firstChild?.url.subscribe(url => {
      if (url && url.length > 0) {
        const segment = url[0].path;
        if (segment === 'colaboradores' || segment === 'solicitudes' || segment === 'configuracion' || segment === 'dashboard') {
          this.activeSection = segment as AdminSection;
        }
      }
    });
  }

  cerrarSesion() {
    this.router.navigate(['/login']);
  }
}
