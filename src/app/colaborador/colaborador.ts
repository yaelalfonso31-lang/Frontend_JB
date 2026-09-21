import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, ActivatedRoute, Router } from '@angular/router'; 

type ColaboradorSection = 'dashboard' | 'solicitudes' | 'instalaciones' | 'calendario';

@Component({
  selector: 'app-colaborador',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './colaborador.html',
  styleUrl: './colaborador.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColaboradorComponent implements OnInit {
  activeSection: ColaboradorSection = 'dashboard';
  
  // 👉 ESTA ES LA LÍNEA CLAVE QUE FALTA
  private router = inject(Router); 

  constructor(private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.activatedRoute.firstChild?.url.subscribe(url => {
      if (url && url.length > 0) {
        const segment = url[0].path;
        if (segment === 'dashboard' || segment === 'solicitudes' || segment === 'instalaciones' || segment === 'calendario') {
          this.activeSection = segment as ColaboradorSection;
        }
      }
    });
  }

  cerrarSesion() {
    this.router.navigate(['/login']);
  }
}