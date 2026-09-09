import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Colaborador {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  cargo: string;
  estado: 'activo' | 'inactivo';
  fechaRegistro: string;
}

@Component({
  selector: 'app-lista-colaboradores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-colaboradores.html',
  styleUrl: './lista-colaboradores.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListaColaboradoresComponent implements OnInit {
  private http = inject(HttpClient);

  // Inicializamos vacío
  colaboradores = signal<Colaborador[]>([]);
  searchTerm = signal('');
  filterEstado = signal<'todos' | 'activo' | 'inactivo'>('todos');

  ngOnInit(): void {
    this.cargarColaboradores();
  }

  cargarColaboradores() {
    this.http.get<Colaborador[]>('/api/colaboradores').subscribe({
      next: (data) => this.colaboradores.set(data),
      error: (err) => console.error('Error al cargar colaboradores:', err)
    });
  }

  filteredColaboradores = computed(() => {
    return this.colaboradores().filter(col => {
      const matchSearch =
        col.nombre.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
        col.email.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
        col.cargo.toLowerCase().includes(this.searchTerm().toLowerCase());

      const matchEstado =
        this.filterEstado() === 'todos' || col.estado === this.filterEstado();

      return matchSearch && matchEstado;
    });
  });

  onSearch(value: string) {
    this.searchTerm.set(value);
  }

  onFilterEstado(value: 'todos' | 'activo' | 'inactivo') {
    this.filterEstado.set(value);
  }

  editarColaborador(id: number) {
    console.log('Editar colaborador:', id);
    // Aquí luego podrías abrir un modal o navegar a una ruta de edición
  }

  eliminarColaborador(id: number) {
    if (confirm('¿Estás seguro de que deseas eliminar a este colaborador?')) {
      this.http.delete(`/api/colaboradores/${id}`).subscribe({
        next: () => {
          const currentList = this.colaboradores();
          this.colaboradores.set(currentList.filter(col => col.id !== id));
        },
        error: (err) => console.error('Error al eliminar:', err)
      });
    }
  }

  toggleEstado(id: number) {
    const currentList = this.colaboradores();
    const colaborador = currentList.find(c => c.id === id);
    
    if (colaborador) {
      // Forzamos el tipo literal
      const nuevoEstado: 'activo' | 'inactivo' = colaborador.estado === 'activo' ? 'inactivo' : 'activo';
      
      this.http.put(`/api/colaboradores/${id}/estado`, { estado: nuevoEstado }).subscribe({
        next: () => {
          // Le decimos explícitamente a TypeScript que el resultado es un arreglo de Colaboradores
          const updated: Colaborador[] = currentList.map(col => 
            col.id === id ? { ...col, estado: nuevoEstado } : col
          );
          this.colaboradores.set(updated);
        },
        error: (err) => console.error('Error al cambiar estado:', err)
      });
    }
  }
}