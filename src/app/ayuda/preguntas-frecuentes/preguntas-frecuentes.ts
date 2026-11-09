import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface FAQItem {
  id: string;
  pregunta: string;
  respuesta: string;
  categoria: 'visitas' | 'costos' | 'talleres' | 'instalaciones';
  abierta?: boolean;
}

@Component({
  selector: 'app-preguntas-frecuentes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './preguntas-frecuentes.html',
  styleUrl: './preguntas-frecuentes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreguntasFrecuentesComponent {
  readonly searchTerm = signal('');
  readonly selectedCategory = signal<string>('todas');
  readonly openedFaqId = signal<string | null>(null);

  readonly faqs = signal<FAQItem[]>([
    {
      id: 'faq-1',
      categoria: 'visitas',
      pregunta: '¿Cuáles son los horarios de atención del Jardín Botánico?',
      respuesta: 'Atendemos de lunes a viernes de 8:00 a.m. a 4:00 p.m. Para visitas guiadas escolares o grupales, se requiere reserva previa a través de nuestra plataforma de solicitudes.'
    },
    {
      id: 'faq-2',
      categoria: 'visitas',
      pregunta: '¿Cómo puedo agendar una visita guiada para una escuela o grupo?',
      respuesta: 'Puedes agendarla ingresando a la sección "Solicitar Visita Guiada" en el menú principal, seleccionando la fecha disponible y completando los datos de la institución educativa.'
    },
    {
      id: 'faq-3',
      categoria: 'costos',
      pregunta: '¿El acceso al Jardín Botánico tiene algún costo?',
      respuesta: 'La entrada general tiene una cuota de recuperación simbólica. Estudiantes, profesores e investigadores con credencial BUAP vigente cuentan con acceso gratuito.'
    },
    {
      id: 'faq-4',
      categoria: 'talleres',
      pregunta: '¿Qué tipo de talleres imparte el Jardín Botánico?',
      respuesta: 'Impartimos talleres de propagación de plantas, elaboración de compostaje, botánica ilustrada, conservación de cactáceas y cultivo de huertos urbanos.'
    },
    {
      id: 'faq-5',
      categoria: 'instalaciones',
      pregunta: '¿Se permite la entrada con alimentos o mascotas?',
      respuesta: 'Se permite el ingreso de agua y snacks ligeros para consumo en las áreas destinadas. Por razones de conservación de las colecciones biológicas, no se permite el ingreso de mascotas.'
    },
    {
      id: 'faq-6',
      categoria: 'instalaciones',
      pregunta: '¿Tienen acceso o facilidades para personas con movilidad reducida?',
      respuesta: 'Sí, la mayor parte de nuestros andadores principales son accesibles para sillas de ruedas y contamos con rampas y sanitarios adaptados.'
    }
  ]);

  readonly faqsFiltradas = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const cat = this.selectedCategory();

    return this.faqs().filter(faq => {
      const coincideCat = cat === 'todas' || faq.categoria === cat;
      const coincideTexto = !term || 
        faq.pregunta.toLowerCase().includes(term) || 
        faq.respuesta.toLowerCase().includes(term);
      return coincideCat && coincideTexto;
    });
  });

  toggleFaq(id: string): void {
    this.openedFaqId.update(current => (current === id ? null : id));
  }
}