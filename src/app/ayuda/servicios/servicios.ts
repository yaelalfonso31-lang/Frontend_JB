import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

export interface ServicioEducativo {
  id: string;
  nombre: string;
  categoria: 'visita' | 'taller_general' | 'taller_especial';
  categoriaLabel: string;
  duracion: string;
  nivel: string;
  proposito: string;
  precio: number;
  temas?: string[];
  notaExtra?: string;
}

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './servicios.html',
  styleUrl: './servicios.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Servicios {
  readonly searchTerm = signal('');
  readonly selectedCategory = signal<'todos' | 'visita' | 'taller_general' | 'taller_especial'>('todos');

  readonly servicios: ServicioEducativo[] = [
    // VISITAS
    {
      id: 'visita_guiada',
      nombre: 'Visita Guiada',
      categoria: 'visita',
      categoriaLabel: 'Visita',
      duracion: '1 hora 15 min.',
      nivel: 'Todo público y escolar',
      proposito: '¡Conoce las plantas del Estado de Puebla mientras recorres las colecciones vivas del Jardín Botánico!',
      precio: 30,
    },
    {
      id: 'visita_tematica',
      nombre: 'Visita Temática',
      categoria: 'visita',
      categoriaLabel: 'Visita Especializada',
      duracion: '1 hora 30 min.',
      nivel: 'Nivel Profesional / Todo público',
      proposito: 'Paisajismo (A nivel profesional)',
      precio: 99,
      temas: [
        'Nuestros árboles',
        '¿Qué es conservación y por qué conservar?'
      ]
    },

    // TALLERES GENERALES
    {
      id: 'conociendo_medio_ambiente',
      nombre: 'Conociendo y conservando el medio ambiente',
      categoria: 'taller_general',
      categoriaLabel: 'Taller General',
      duracion: '1 hora',
      nivel: 'Secundaria y bachillerato',
      proposito: 'Conoce qué es un ecosistema, cuál es el impacto que el ser humano tiene sobre ellos y súmate a las soluciones para cuidar nuestro medio ambiente.',
      precio: 125,
      notaExtra: 'No incluye visita guiada'
    },
    {
      id: 'crea_herbario',
      nombre: 'Crea tu herbario',
      categoria: 'taller_general',
      categoriaLabel: 'Taller General',
      duracion: '1 hora',
      nivel: '3° Primaria a nivel medio superior',
      proposito: 'Conoce qué es un herbario, cuáles son las características de los ejemplares que albergan y su importancia para el conocimiento de nuestro mundo.',
      precio: 125,
      notaExtra: 'No incluye visita guiada'
    },
    {
      id: 'fosiles_plantas',
      nombre: 'De fósiles y plantas',
      categoria: 'taller_general',
      categoriaLabel: 'Taller General',
      duracion: '1 hora',
      nivel: 'Primaria, secundaria y bachillerato',
      proposito: 'Conocer la importancia del registro fósil para descubrir los seres vivos que habitaron en el pasado.',
      precio: 99,
      notaExtra: 'No incluye visita guiada'
    },
    {
      id: 'detective_botanico',
      nombre: 'El detective botánico',
      categoria: 'taller_general',
      categoriaLabel: 'Taller General',
      duracion: '1 hora',
      nivel: '3° Preescolar a 3° de primaria',
      proposito: 'Aprender a distinguir cuáles son las características que hacen a las plantas seres vivos tan diferentes de los demás.',
      precio: 99,
      notaExtra: 'No incluye visita guiada'
    },
    {
      id: 'horticultura',
      nombre: 'Horticultura',
      categoria: 'taller_general',
      categoriaLabel: 'Taller General',
      duracion: '1 hora',
      nivel: 'De Preescolar a nivel superior',
      proposito: 'Aprender a cultivar hortalizas para fomentar la autoproducción de estos alimentos.',
      precio: 125,
      notaExtra: 'No incluye visita guiada'
    },
    {
      id: 'insectos',
      nombre: 'Insectos',
      categoria: 'taller_general',
      categoriaLabel: 'Taller General',
      duracion: '1 hora',
      nivel: 'Primaria, secundaria y bachillerato',
      proposito: 'Diferenciar a los insectos de otros organismos y conocer las formas en que se relacionan con las plantas.',
      precio: 99,
      notaExtra: 'No incluye visita guiada'
    },
    {
      id: 'lombricomposta',
      nombre: 'Lombricomposta',
      categoria: 'taller_general',
      categoriaLabel: 'Taller General',
      duracion: '1 hora',
      nivel: '4° Primaria a nivel superior',
      proposito: 'Reconocer que existen alternativas para aprovechar los restos orgánicos y disminuir la generación de basura.',
      precio: 125,
      notaExtra: 'No incluye visita guiada'
    },
    {
      id: 'terrarios',
      nombre: 'Terrarios (un mini jardín)',
      categoria: 'taller_general',
      categoriaLabel: 'Taller General',
      duracion: '1 hora',
      nivel: 'De Preescolar a nivel superior',
      proposito: 'Conocer de forma sencilla los ecosistemas que existen en nuestro país para valorar la biodiversidad mexicana.',
      precio: 145,
      notaExtra: 'No incluye visita guiada'
    },

    // TALLERES ESPECIALES
    {
      id: 'colecta_plantas',
      nombre: 'Colecta de plantas',
      categoria: 'taller_especial',
      categoriaLabel: 'Taller Especial',
      duracion: '2 horas',
      nivel: 'Técnico y profesional',
      proposito: 'Conoce la metodología para crear una colección científica de plantas y revisar las técnicas para realizar colectas, prensado y fijación de plantas.',
      precio: 190,
      notaExtra: 'No incluye visita guiada'
    },
    {
      id: 'plantas_medicinales',
      nombre: 'Plantas medicinales',
      categoria: 'taller_especial',
      categoriaLabel: 'Taller Especial',
      duracion: '2 horas',
      nivel: 'Bachillerato, técnico y profesional',
      proposito: 'Mostrar los procesos más importantes para la colecta, el secado y el almacenado de plantas medicinales, así como las técnicas de cultivo.',
      precio: 190,
      notaExtra: 'No incluye visita guiada'
    }
  ];

  readonly serviciosFiltrados = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const cat = this.selectedCategory();

    return this.servicios.filter((s) => {
      const matchCategory = cat === 'todos' || s.categoria === cat;
      const matchText =
        !term ||
        s.nombre.toLowerCase().includes(term) ||
        s.nivel.toLowerCase().includes(term) ||
        s.proposito.toLowerCase().includes(term);

      return matchCategory && matchText;
    });
  });
}