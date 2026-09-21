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

interface ColaboradorForm {
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

  colaboradores = signal<Colaborador[]>([
    {
      id: 1,
      nombre: 'Ana García',
      email: 'ana.garcia@jb.edu.mx',
      telefono: '555-0123',
      cargo: 'Coordinadora de visitas',
      estado: 'activo',
      fechaRegistro: '2025-01-15'
    },
    {
      id: 2,
      nombre: 'Luis Ramírez',
      email: 'luis.ramirez@jb.edu.mx',
      telefono: '555-0198',
      cargo: 'Asistente de monitoreo',
      estado: 'inactivo',
      fechaRegistro: '2025-02-20'
    }
  ]);
  searchTerm = signal('');
  filterEstado = signal<'todos' | 'activo' | 'inactivo'>('todos');
  modalAbierto = signal(false);
  modoModal = signal<'create' | 'edit'>('create');
  colaboradorSeleccionado = signal<Colaborador | null>(null);
  formulario = signal<ColaboradorForm>({
    nombre: '',
    email: '',
    telefono: '',
    cargo: '',
    estado: 'activo',
    fechaRegistro: new Date().toISOString().slice(0, 10)
  });

  ngOnInit(): void {
    this.cargarColaboradores();
  }

  cargarColaboradores() {
    this.http.get<Colaborador[]>('/api/colaboradores').subscribe({
      next: (data) => this.colaboradores.set(data.length ? data : this.colaboradores()),
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

  actualizarCampo(field: keyof ColaboradorForm, value: string) {
    const current = this.formulario();
    this.formulario.set({
      ...current,
      [field]: field === 'estado' ? (value as 'activo' | 'inactivo') : value
    });
  }

  abrirModalCrear() {
    this.modoModal.set('create');
    this.colaboradorSeleccionado.set(null);
    this.formulario.set({
      nombre: '',
      email: '',
      telefono: '',
      cargo: '',
      estado: 'activo',
      fechaRegistro: new Date().toISOString().slice(0, 10)
    });
    this.modalAbierto.set(true);
  }

  abrirModalEditar(colaborador: Colaborador) {
    this.modoModal.set('edit');
    this.colaboradorSeleccionado.set(colaborador);
    this.formulario.set({
      nombre: colaborador.nombre,
      email: colaborador.email,
      telefono: colaborador.telefono,
      cargo: colaborador.cargo,
      estado: colaborador.estado,
      fechaRegistro: colaborador.fechaRegistro
    });
    this.modalAbierto.set(true);
  }

  cerrarModal() {
    this.modalAbierto.set(false);
    this.colaboradorSeleccionado.set(null);
  }

  guardarColaborador() {
    const payload = this.formulario();
    const currentList = this.colaboradores();

    if (!payload.nombre || !payload.email || !payload.cargo) {
      alert('Completa nombre, correo y cargo para guardar el colaborador.');
      return;
    }

    if (this.modoModal() === 'edit') {
      const colaboradorActual = this.colaboradorSeleccionado();
      if (!colaboradorActual) return;

      const updatedList = currentList.map(col =>
        col.id === colaboradorActual.id ? { ...col, ...payload } : col
      );
      this.colaboradores.set(updatedList);
    } else {
      const nuevoColaborador: Colaborador = {
        id: Date.now(),
        nombre: payload.nombre,
        email: payload.email,
        telefono: payload.telefono,
        cargo: payload.cargo,
        estado: payload.estado,
        fechaRegistro: payload.fechaRegistro
      };
      this.colaboradores.set([nuevoColaborador, ...currentList]);
    }

    this.cerrarModal();
  }

  editarColaborador(id: number) {
    const colaborador = this.colaboradores().find(col => col.id === id);
    if (colaborador) {
      this.abrirModalEditar(colaborador);
    }
  }

  eliminarColaborador(id: number) {
    const currentList = this.colaboradores();
    this.colaboradores.set(currentList.filter(col => col.id !== id));
  }

  toggleEstado(id: number) {
    const currentList = this.colaboradores();
    const colaborador = currentList.find(c => c.id === id);

    if (colaborador) {
      const nuevoEstado: 'activo' | 'inactivo' = colaborador.estado === 'activo' ? 'inactivo' : 'activo';

      this.http.put(`/api/colaboradores/${id}/estado`, { estado: nuevoEstado }).subscribe({
        next: () => {
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
