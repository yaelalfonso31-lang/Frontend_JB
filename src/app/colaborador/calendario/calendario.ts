import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface VisitaCalendario {
  id: number;
  solicitante: string;
  escuela: string;
  fechaVisita: string;
  horaVisita: string;
  numeroVisitantes: number;
  estado: string;
}

@Component({
  selector: 'app-colaborador-calendario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendario.html',
  styleUrl: './calendario.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Calendario implements OnInit {
  private http = inject(HttpClient);

  vistaActual = signal<'mensual' | 'semanal'>('mensual');
  
  // Iniciamos vacío
  visitas = signal<VisitaCalendario[]>([]);

  ngOnInit(): void {
    this.cargarVisitas();
  }

  cargarVisitas() {
    this.http.get<VisitaCalendario[]>('/api/calendario/aprobadas').subscribe({
      next: (data) => this.visitas.set(data),
      error: (err) => console.error('Error al cargar calendario:', err)
    });
  }

  cambiarVista(tipo: 'mensual' | 'semanal') {
    this.vistaActual.set(tipo);
  }
}