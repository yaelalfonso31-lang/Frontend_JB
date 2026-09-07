import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
export class ListaColaboradoresComponent {
  colaboradores = signal<Colaborador[]>([
    {
      id: 1,
      nombre: 'Juan Pérez',
      email: 'juan@example.com',
      telefono: '3001234567',
      cargo: 'Coordinador',
      estado: 'activo',
      fechaRegistro: '2024-01-15'
    },
    {
      id: 2,
      nombre: 'María García',
      email: 'maria@example.com',
      telefono: '3007654321',
      cargo: 'Asistente',
      estado: 'activo',
      fechaRegistro: '2024-02-20'
    },
    {
      id: 3,
      nombre: 'Carlos López',
      email: 'carlos@example.com',
      telefono: '3009876543',
      cargo: 'Supervisor',
      estado: 'inactivo',
      fechaRegistro: '2024-01-10'
    }
  ]);

  searchTerm = signal('');
  filterEstado = signal<'todos' | 'activo' | 'inactivo'>('todos');

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
  }

  eliminarColaborador(id: number) {
    const currentList = this.colaboradores();
    this.colaboradores.set(currentList.filter(col => col.id !== id));
  }

  toggleEstado(id: number) {
    const currentList = this.colaboradores();
    const updated = currentList.map(col => {
      if (col.id === id) {
        const nuevoEstado: 'activo' | 'inactivo' = col.estado === 'activo' ? 'inactivo' : 'activo';
        return { ...col, estado: nuevoEstado };
      }
      return col;
    });
    this.colaboradores.set(updated);
  }
}
