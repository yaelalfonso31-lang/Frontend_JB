import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface CategoryCard {
  titulo: string;
  descripcion: string;
  icono: string;
  ruta?: string;
  enlaceExterno?: string;
}

interface ContactChannel {
  titulo: string;
  detalle: string;
  horario: string;
  icono: string;
  accionText: string;
  accionHref: string;
}

@Component({
  selector: 'app-centro-ayuda',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './centro-ayuda.html',
  styleUrl: './centro-ayuda.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CentroAyudaComponent {
  readonly categorias = signal<CategoryCard[]>([
    {
      titulo: 'Preguntas Frecuentes',
      descripcion: 'Resuelve tus dudas sobre recorridos, talleres, cuotas y reservas.',
      icono: 'fa-solid fa-circle-question',
      ruta: '/preguntas-frecuentes',
    },
    {
      titulo: 'Reglamento del Jardín',
      descripcion: 'Consulta las normas de conservación, fotografía y comportamiento.',
      icono: 'fa-solid fa-book-bookmark',
      ruta: '/reglamento-jardin',
    },
    {
      titulo: 'Solicitud de Visitas',
      descripcion: 'Guía paso a paso para agendar visitas guiadas grupales o escolares.',
      icono: 'fa-solid fa-calendar-check',
      ruta: '/solicitud-visita',
    },
    {
      titulo: 'Consulta de Solicitud',
      descripcion: 'Revisa el estado de tu folio de reserva o confirmación enviada.',
      icono: 'fa-solid fa-magnifying-glass-chart',
      ruta: '/consultar-solicitud',
    },
  ]);

  readonly canalesContacto = signal<ContactChannel[]>([
    {
      titulo: 'Atención Telefónica',
      detalle: '+52 (222) 229 5500 Ext. 7030',
      horario: 'Lunes a Viernes: 8:00 AM - 4:00 PM',
      icono: 'fa-solid fa-phone',
      accionText: 'Llamar ahora',
      accionHref: 'tel:+522222295500',
    },
    {
      titulo: 'Correo Electrónico',
      detalle: 'jardin.botanico@correo.buap.mx',
      horario: 'Respuesta en un lapso de 24 a 48 horas hábiles',
      icono: 'fa-solid fa-envelope',
      accionText: 'Enviar mensaje',
      accionHref: 'mailto:jardin.botanico@correo.buap.mx',
    },
    {
      titulo: 'Atención Presencial',
      detalle: 'Área de Educación y Divulgación',
      horario: 'Ciudad Universitaria BUAP, Puebla, Pue.',
      icono: 'fa-solid fa-location-dot',
      accionText: 'Ver Ubicación',
      accionHref: 'https://maps.google.com',
    },
  ]);
}