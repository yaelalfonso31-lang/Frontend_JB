import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface ReporteInstalacion {
  id: number;
  zona: string;
  estado: 'operativo' | 'mantenimiento' | 'cerrado';
  descripcion: string;
  fechaReporte: string;
  reportadoPor: string;
}

@Component({
  selector: 'app-colaborador-instalaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './instalaciones.html',
  styleUrl: './instalaciones.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Instalaciones implements OnInit {
  private http = inject(HttpClient);
  
  // El signal ahora inicia vacío, se llenará desde MariaDB
  reportes = signal<ReporteInstalacion[]>([]);

  cantOperativos = computed(() => this.reportes().filter(r => r.estado === 'operativo').length);
  cantMantenimiento = computed(() => this.reportes().filter(r => r.estado === 'mantenimiento').length);
  cantCerrados = computed(() => this.reportes().filter(r => r.estado === 'cerrado').length);

  mostrarModal = signal(false);
  nuevaZona = signal('');
  nuevoEstado = signal<'operativo' | 'mantenimiento' | 'cerrado'>('operativo');
  nuevaDescripcion = signal('');

  ngOnInit() {
    this.cargarReportes();
  }

  cargarReportes() {
    this.http.get<ReporteInstalacion[]>('/api/instalaciones').subscribe({
      next: (data) => this.reportes.set(data),
      error: (err) => console.error('Error al cargar la bitácora:', err)
    });
  }

  abrirModal() {
    this.nuevaZona.set('');
    this.nuevoEstado.set('operativo');
    this.nuevaDescripcion.set('');
    this.mostrarModal.set(true);
  }

  cerrarModal() {
    this.mostrarModal.set(false);
  }

  guardarReporte() {
    if (!this.nuevaZona() || !this.nuevaDescripcion()) return;

    const payload = {
      zona: this.nuevaZona(),
      estado: this.nuevoEstado(),
      descripcion: this.nuevaDescripcion(),
      reportadoPor: 'Colaborador' // Próximamente lo tomaremos del usuario logueado
    };

    // Llamada POST real a tu API de FastAPI
    this.http.post('/api/instalaciones', payload).subscribe({
      next: () => {
        this.cargarReportes(); // Recargamos la tabla desde la BD
        this.cerrarModal();
      },
      error: (err) => console.error('Error al guardar reporte:', err)
    });
  }
}