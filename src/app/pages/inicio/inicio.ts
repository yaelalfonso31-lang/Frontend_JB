import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

interface ServicioDestacado {
  titulo: string;
  subtitulo: string;
  descripcion: string;
  icono: string;
  etiqueta: string;
  imagen: string;
  fallback: string;
}

interface FotoGaleria {
  titulo: string;
  categoria: string;
  icono: string;
  imagen: string;
  fallback: string;
  destacada?: boolean;
}

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InicioComponent {
  private router = inject(Router);

  // Puedes colocar tus futuras fotos en public/assets/ y actualizar la ruta en 'imagen'
  readonly servicios: ServicioDestacado[] = [
    {
      titulo: 'Visita Guiada',
      subtitulo: 'Recorrido interpretativo',
      descripcion: 'Explora las colecciones biológicas del jardín acompañado por un guía especializado que adaptará el recorrido al nivel educativo de tu grupo.',
      icono: 'bi-compass-fill',
      etiqueta: 'Todos los niveles',
      imagen: '/assets/visita-guiada.jpg',
      fallback: '/assets/fondoJB.jpg'
    },
    {
      titulo: 'Visita Temática',
      subtitulo: 'Enfoque curricular',
      descripcion: 'Recorridos especializados enfocados en temas específicos de botánica, ecología, evolución y conservación de especies endémicas.',
      icono: 'bi-flower1',
      etiqueta: 'Secundaria a Licenciatura',
      imagen: '/assets/visita-tematica.jpg',
      fallback: '/assets/fondoJB2.jpg'
    },
    {
      titulo: 'Talleres Educativos',
      subtitulo: 'Aprendizaje práctico',
      descripcion: 'Complementa tu visita con actividades prácticas como "Crea tu herbario", "De fósiles y plantas" y sesiones de "Horticultura".',
      icono: 'bi-mortarboard-fill',
      etiqueta: 'Práctico e interactivo',
      imagen: '/assets/talleres-educativos.jpg',
      fallback: '/assets/fondo3.jpg'
    }
  ];

  // Galería preparada para las fotos que agregues a tu carpeta de assets
  readonly galeria: FotoGaleria[] = [
    {
      titulo: 'Colecciones Botánicas al Aire Libre',
      categoria: 'Biodiversidad',
      icono: 'bi-tree-fill',
      imagen: '/assets/galeria-1.jpg',
      fallback: '/assets/fondo3.jpg',
      destacada: true
    },
    {
      titulo: 'Jardín de Cactáceas y Suculentas',
      categoria: 'Zonas Áridas',
      icono: 'bi-brightness-high-fill',
      imagen: '/assets/galeria-2.jpg',
      fallback: '/assets/fondoJB.jpg'
    },
    {
      titulo: 'Lago y Humedal Universitario',
      categoria: 'Ecosistemas Acuáticos',
      icono: 'bi-water',
      imagen: '/assets/galeria-3.jpg',
      fallback: '/assets/fondoJB2.jpg'
    },
    {
      titulo: 'Aulas y Espacios para Talleres',
      categoria: 'Divulgación Científica',
      icono: 'bi-easel2-fill',
      imagen: '/assets/galeria-4.jpg',
      fallback: '/assets/fondoJB.jpg'
    }
  ];

  // Si la foto nueva aún no existe en /assets/, carga automáticamente la imagen de respaldo
  onImageError(event: Event, fallbackUrl: string): void {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement && imgElement.src !== location.origin + fallbackUrl) {
      imgElement.src = fallbackUrl;
    }
  }

  irASolicitud(): void {
    this.router.navigate(['/solicitud-visita']);
  }

  irAEstadoSolicitud(): void {
    this.router.navigate(['/consultar-solicitud']);
  }

  irALogin(): void {
    this.router.navigate(['/login']);
  }

  irAReglamentoJardin(): void {
    this.router.navigate(['/reglamento-jardin']);
  }

  irAPreguntasFrecuentes(): void {
    this.router.navigate(['/preguntas-frecuentes']);
  }
}