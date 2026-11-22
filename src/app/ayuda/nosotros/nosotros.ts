import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

export interface FotoGaleria {
  src: string;
  titulo: string;
  descripcion: string;
  categoria: 'visitas' | 'talleres' | 'instalaciones';
}

export interface Acreditacion {
  titulo: string;
  subtitulo: string;
  icono: string;
}

@Component({
  selector: 'app-nosotros',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './nosotros.html',
  styleUrl: './nosotros.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Nosotros {
  readonly selectedCategory = signal<'todas' | 'visitas' | 'talleres' | 'instalaciones'>('todas');
  readonly selectedPhoto = signal<FotoGaleria | null>(null);

  readonly acreditaciones: Acreditacion[] = [
    {
      titulo: 'BGCI Botanic Garden',
      subtitulo: 'Certificado Internacionalmente & Conservation Practitioner',
      icono: 'bi bi-globe-americas',
    },
    {
      titulo: 'ArbNet Nivel III',
      subtitulo: 'Acreditación Internacional de Arboreto',
      icono: 'bi bi-tree',
    },
    {
      titulo: 'ISO 9001-2015 & 37001-2016',
      subtitulo: 'Gestión de Calidad y Antisoborno',
      icono: 'bi bi-patch-check',
    },
    {
      titulo: 'CECA SEMARNAT & Mérito Ecológico',
      subtitulo: 'Centro de Educación y Cultura Ambiental',
      icono: 'bi bi-award',
    },
  ];

  readonly galeria: FotoGaleria[] = [
    // INSTALACIONES Y FLORA
    {
      src: 'assets/fondoJB2.jpg',
      titulo: 'Lago y Colecciones Vivas',
      descripcion: 'Vista panorámica de las áreas verdes y cuerpo de agua del Jardín Botánico Universitario.',
      categoria: 'instalaciones',
    },
    {
      src: 'assets/foto13.jpg',
      titulo: 'Área de Propagación e Invernadero',
      descripcion: 'Cuidado, germinación y resguardo de ejemplares vegetales en etapa de desarrollo.',
      categoria: 'instalaciones',
    },
    {
      src: 'assets/foto20.jpg',
      titulo: 'Conservación y Reforestación',
      descripcion: 'Siembra y manejo de especies nativas.',
      categoria: 'instalaciones',
    },
    {
      src: 'assets/foto8.jpg',
      titulo: 'Senderos del Jardín Botánico',
      descripcion: 'Espacios naturales diseñados para el aprendizaje y conexión con la biodiversidad.',
      categoria: 'instalaciones',
    },
    {
      src: 'assets/foto9.jpg',
      titulo: 'Colecciones Botánicas',
      descripcion: 'Diversidad vegetal representativa del Estado de Puebla.',
      categoria: 'instalaciones',
    },
    {
      src: 'assets/foto10.jpg',
      titulo: 'Paisajismo Universitario',
      descripcion: 'Áreas de conservación y contemplación dentro de Ciudad Universitaria BUAP.',
      categoria: 'instalaciones',
    },
    {
      src: 'assets/foto11.jpg',
      titulo: 'Flora Regional',
      descripcion: 'Ejemplares bajo resguardo científico y educativo.',
      categoria: 'instalaciones',
    },
    {
      src: 'assets/foto12.jpg',
      titulo: 'Ecosistemas en Resguardo',
      descripcion: 'Recorridos interpretativos entre colecciones vivas.',
      categoria: 'instalaciones',
    },

    // VISITAS GUIADAS
    {
      src: 'assets/foto1.jpg',
      titulo: 'Visitas Guiadas Escolares',
      descripcion: 'Recorridos acompañados por guías especializados en educación ambiental.',
      categoria: 'visitas',
    },
    {
      src: 'assets/foto2.jpg',
      titulo: 'Exploración en Grupo',
      descripcion: 'Estudiantes conociendo la importancia de la flora poblana.',
      categoria: 'visitas',
    },
    {
      src: 'assets/foto3.jpg',
      titulo: 'Educación al Aire Libre',
      descripcion: 'Aprendizaje vivencial a través de los senderos del jardín.',
      categoria: 'visitas',
    },
    {
      src: 'assets/foto4.jpg',
      titulo: 'Recorridos Interpretativos',
      descripcion: 'Grupos escolares interactuando con el entorno natural.',
      categoria: 'visitas',
    },
    {
      src: 'assets/foto5.jpg',
      titulo: 'Comunidad Visitante',
      descripcion: 'Fomentando el respeto y valoración por los ecosistemas.',
      categoria: 'visitas',
    },
    {
      src: 'assets/foto6.jpg',
      titulo: 'Atención a Instituciones Educativas',
      descripcion: 'Visitas adaptadas a todos los niveles escolares.',
      categoria: 'visitas',
    },
    {
      src: 'assets/foto7.jpg',
      titulo: 'Experiencia Botánica',
      descripcion: 'Descubriendo la biodiversidad local en cada estación.',
      categoria: 'visitas',
    },
    {
      src: 'assets/foto17.jpg',
      titulo: 'Grupos de Visitantes',
      descripcion: 'Recuerdos de visitas institucionales en nuestras áreas verdes.',
      categoria: 'visitas',
    },
    {
      src: 'assets/foto18.jpg',
      titulo: 'Recorrido Guiado',
      descripcion: 'Acompañamiento educativo durante la estancia en el jardín.',
      categoria: 'visitas',
    },

    // TALLERES EDUCATIVOS
    {
      src: 'assets/detective1.jpg',
      titulo: 'Taller: El Detective Botánico',
      descripcion: 'Observación directa de las características que hacen únicas a las plantas.',
      categoria: 'talleres',
    },
    {
      src: 'assets/detective2.jpg',
      titulo: 'Exploración con Lupas',
      descripcion: 'Actividades prácticas para despertar la curiosidad científica infantil.',
      categoria: 'talleres',
    },
    {
      src: 'assets/detective3.jpg',
      titulo: 'Descubriendo el Reino Vegetal',
      descripcion: 'Dinámicas interactivas para nivel preescolar y primaria.',
      categoria: 'talleres',
    },
    {
      src: 'assets/detective4.jpg',
      titulo: 'Ciencia para Niños',
      descripcion: 'Aprendiendo a identificar hojas, tallos y estructuras vegetales.',
      categoria: 'talleres',
    },
    {
      src: 'assets/detective5.jpg',
      titulo: 'Observación en Campo',
      descripcion: 'Taller El Detective Botánico en acción.',
      categoria: 'talleres',
    },
    {
      src: 'assets/detective6.jpg',
      titulo: 'Trabajo en Equipo',
      descripcion: 'Niños participando activamente en actividades de educación ambiental.',
      categoria: 'talleres',
    },
    {
      src: 'assets/detective7.jpg',
      titulo: 'Aprendizaje Lúdico',
      descripcion: 'Acercamiento temprano a la botánica y conservación.',
      categoria: 'talleres',
    },
    {
      src: 'assets/detective8.jpg',
      titulo: 'Pequeños Investigadores',
      descripcion: 'Conociendo la diversidad de plantas del jardín.',
      categoria: 'talleres',
    },
    {
      src: 'assets/detective9.jpg',
      titulo: 'Cierre de Actividad Botánica',
      descripcion: 'Experiencia educativa en nuestros espacios de taller.',
      categoria: 'talleres',
    },
    {
      src: 'assets/foto14.jpg',
      titulo: 'Taller: De Fósiles y Plantas',
      descripcion: 'Análisis de muestras y registros para comprender la evolución vegetal.',
      categoria: 'talleres',
    },
    {
      src: 'assets/foto15.jpg',
      titulo: 'Expresión y Arte Botánico',
      descripcion: 'Actividades creativas vinculadas con la naturaleza y el medio ambiente.',
      categoria: 'talleres',
    },
    {
      src: 'assets/foto16.jpg',
      titulo: 'Observación Detallada',
      descripcion: 'Uso de instrumentos de aumento para estudiar estructuras de las plantas.',
      categoria: 'talleres',
    },
  ];

  readonly fotosFiltradas = computed(() => {
    const cat = this.selectedCategory();
    if (cat === 'todas') return this.galeria;
    return this.galeria.filter((f) => f.categoria === cat);
  });

  abrirFoto(foto: FotoGaleria): void {
    this.selectedPhoto.set(foto);
  }

  cerrarFoto(): void {
    this.selectedPhoto.set(null);
  }
}