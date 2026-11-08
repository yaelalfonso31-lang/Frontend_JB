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
        'No se permite ingresar con: mascotas, bicicletas, balones, radios / grabadoras y bebidas alcohólicas.',
        'Respeta al guía y / o facilitador.',
        'Estimado profesor: para un mejor aprovechamiento de la visita le pedimos que acompañe a su grupo durante todas las actividades. Recuerde, el responsable del comportamiento adecuado de su grupo es usted.',
        'Queda prohibido llevarse las etiquetas de las plantas',
        'Por su seguridad no ingresar al lago'
      ]
    },
    {
      id: 'conservacion',
      titulo: 'Conservación y Cuidado de la Flora',
      icono: 'fa-solid fa-leaf',
      descripcion: 'Medidas obligatorias para proteger el patrimonio biológico e investigaciones.',
      reglas: [
        'Queda prohibido llevarse semillas y / o partes de plantas.',
        'Camina únicamente por los senderos de adoquín y los senderos secundarios que el guía les indique.',
        'No se permite dañar las plantas (pisar, rayonear, arrancar flores, frutos u hojas).',
        'No introducir especies vegetales ni animales ajenos al ecosistema del jardín.',
        'Pescar, ni arrojar objetos al lago',
        'Dar comida a las aves y otros animales silvestres',
        'Hacer fogatas'
      ]
    },
    {
      id: 'limpieza',
      titulo: 'Convivencia y Manejo de Residuos',
      icono: 'fa-solid fa-trash-can',
      descripcion: 'Mantener un entorno limpio y respetuoso para toda la comunidad universitaria.',
      reglas: [
        'No se permite hacer picnics',
        'Por favor llévate tu basura o deposítala en los contenedores.',
        'Prohibido fumar o vapear.'
      ]
    },
    {
      id: 'fotografia',
      titulo: 'Fotografía',
      icono: 'fa-solid fa-camera',
      descripcion: 'Regulaciones para sesiones fotográficas comerciales y uso de dispositivos.',
      reglas: [
        'Queda prohibido tomar fotografías con fines comerciales.',
        'El uso de drones está estrictamente sujeto a autorización por escrito de la dirección.'
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