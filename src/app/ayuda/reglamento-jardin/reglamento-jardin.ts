import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface RuleCategory {
  id: string;
  titulo: string;
  icono: string;
  descripcion: string;
  reglas: string[];
}

@Component({
  selector: 'app-reglamento-jardin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reglamento-jardin.html',
  styleUrl: './reglamento-jardin.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReglamentoJardinComponent {
  readonly searchTerm = signal('');
  readonly selectedCategory = signal<string>('todos');

  readonly categorias: RuleCategory[] = [
    {
      id: 'general',
      titulo: 'Normas Generales de Acceso',
      icono: 'fa-solid fa-door-open',
      descripcion: 'Lineamientos para el ingreso y permanencia de visitantes en las instalaciones.',
      reglas: [
        'Respetar los horarios de apertura y cierre oficiales del Jardín Botánico.',
        'Registrarse en la recepción o punto de control antes de ingresar.',
        'Los menores de edad deben permanecer bajo la supervisión constante de un adulto responsable.',
        'Conservar el boleto o comprobante de acceso durante toda la estancia.'
      ]
    },
    {
      id: 'conservacion',
      titulo: 'Conservación y Cuidado de la Flora',
      icono: 'fa-solid fa-leaf',
      descripcion: 'Medidas obligatorias para proteger el patrimonio biológico e investigaciones.',
      reglas: [
        'Queda estrictamente prohibido cortar, maltratar, colectar o sustraer plantas, semillas o flores.',
        'Caminar exclusivamente por los senderos y andadores autorizados.',
        'Evitar trepar árboles, esculturas o estructuras de exhibición.',
        'No introducir especies vegetales ni animales ajenos al ecosistema del jardín.'
      ]
    },
    {
      id: 'limpieza',
      titulo: 'Convivencia y Manejo de Residuos',
      icono: 'fa-solid fa-trash-can',
      descripcion: 'Mantener un entorno limpio y respetuoso para toda la comunidad universitaria.',
      reglas: [
        'Depositar los residuos de forma clasificada en los contenedores correspondientes.',
        'Mantener un volumen de voz moderado; prohibido el uso de bocinas o amplificadores de sonido.',
        'Prohibido fumar, vapear o consumir bebidas alcohólicas dentro de las instalaciones.',
        'No alimentar a la fauna silvestre presente en las áreas verdes.'
      ]
    },
    {
      id: 'fotografia',
      titulo: 'Fotografía, Drones y Eventos',
      icono: 'fa-solid fa-camera',
      descripcion: 'Regulaciones para sesiones fotográficas comerciales y uso de dispositivos.',
      reglas: [
        'La fotografía recreativa no comercial con smartphones está permitida libremente.',
        'Las sesiones fotográficas profesionales (bodas, graduaciones, catálogos) requieren permiso previo.',
        'El uso de drones está estrictamente sujeto a autorización por escrito de la dirección.',
        'No obstruir senderos ni colocar tripies o estructuras que impidan el libre tránsito.'
      ]
    }
  ];

  readonly categoriasFiltradas = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const cat = this.selectedCategory();

    return this.categorias
      .filter(c => cat === 'todos' || c.id === cat)
      .map(c => ({
        ...c,
        reglas: c.reglas.filter(r => r.toLowerCase().includes(term) || c.titulo.toLowerCase().includes(term))
      }))
      .filter(c => c.reglas.length > 0);
  });

  imprimirReglamento(): void {
    window.print();
  }
}