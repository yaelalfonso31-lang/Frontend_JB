import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, ActivatedRoute } from '@angular/router';

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
}
