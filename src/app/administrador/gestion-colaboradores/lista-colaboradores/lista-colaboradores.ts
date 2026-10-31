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
  password?: string;
}

interface ColaboradorForm {
  nombre: string;
  email: string;
  telefono: string;
  cargo: string;
  estado: 'activo' | 'inactivo';
  fechaRegistro: string;
  password?: string;
}

interface SolicitudAsignacion {
  id: number;
  folio: string;
  nombre_escuela: string;
  nivel_educativo: string;
  fecha_visita: string;
  hora_visita?: string;
  total_personas: number;
  estado: string;
  colaborador_id: number | null;
  colaborador_nombre: string;
  fecha_registro: string;
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

  colaboradores = signal<Colaborador[]>([]);
  solicitudes = signal<SolicitudAsignacion[]>([]);
  searchTerm = signal('');
  filterEstado = signal<'todos' | 'activo' | 'inactivo'>('todos');
  searchSolicitud = signal('');
  guardandoAsignacionId = signal<number | null>(null);

  modalAbierto = signal(false);
  modoModal = signal<'create' | 'edit'>('create');
  colaboradorSeleccionado = signal<Colaborador | null>(null);
  formulario = signal<ColaboradorForm>({
    nombre: '',
    email: '',
    telefono: '',
    cargo: '',
    estado: 'activo',
    fechaRegistro: new Date().toISOString().slice(0, 10),
    password: ''
  });

  ngOnInit(): void {
    this.cargarColaboradores();
    this.cargarSolicitudes();
  }

  cargarColaboradores() {
    this.http.get<Colaborador[]>('/api/colaboradores').subscribe({
      next: (data) => this.colaboradores.set(data),
      error: (err) => console.error('Error al cargar colaboradores:', err)
    });
  }

  cargarSolicitudes() {
    this.http.get<SolicitudAsignacion[]>('/api/solicitudes').subscribe({
      next: (data) => this.solicitudes.set(data),
      error: (err) => console.error('Error al cargar solicitudes para asignación:', err)
    });
  }

  colaboradoresActivos = computed(() =>
    this.colaboradores().filter(c => c.estado === 'activo')
  );

  filteredColaboradores = computed(() => {
    return this.colaboradores().filter(col => {
      const matchSearch =
        (col.nombre || '').toLowerCase().includes(this.searchTerm().toLowerCase()) ||
        (col.email || '').toLowerCase().includes(this.searchTerm().toLowerCase()) ||
        (col.cargo || '').toLowerCase().includes(this.searchTerm().toLowerCase());

      const matchEstado =
        this.filterEstado() === 'todos' || col.estado === this.filterEstado();

      return matchSearch && matchEstado;
    });
  });

  filteredSolicitudes = computed(() => {
    const term = this.searchSolicitud().toLowerCase().trim();
    if (!term) return this.solicitudes();
    return this.solicitudes().filter(s =>
      (s.folio || '').toLowerCase().includes(term) ||
      (s.nombre_escuela || '').toLowerCase().includes(term) ||
      (s.colaborador_nombre || '').toLowerCase().includes(term)
    );
  });

  asignarColaborador(solicitudId: number, valorSelect: string) {
    const colaboradorId = valorSelect ? Number(valorSelect) : null;
    this.guardandoAsignacionId.set(solicitudId);

    this.http.put<{ colaborador_id: number | null; colaborador_nombre: string }>(
      `/api/solicitudes/${solicitudId}/asignar`,
      { colaborador_id: colaboradorId }
    ).subscribe({
      next: (res) => {
        this.solicitudes.update(lista =>
          lista.map(s =>
            s.id === solicitudId
              ? { ...s, colaborador_id: res.colaborador_id, colaborador_nombre: res.colaborador_nombre }
              : s
          )
        );
        this.guardandoAsignacionId.set(null);
      },
      error: (err) => {
        console.error('Error al asignar colaborador:', err);
        alert(err?.error?.detail || 'No se pudo asignar el colaborador.');
        this.guardandoAsignacionId.set(null);
        this.cargarSolicitudes();
      }
    });
  }

  onSearch(value: string) {
    this.searchTerm.set(value);
  }

  onSearchSolicitud(value: string) {
    this.searchSolicitud.set(value);
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
      fechaRegistro: new Date().toISOString().slice(0, 10),
      password: ''
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
      fechaRegistro: colaborador.fechaRegistro,
      password: ''
    });
    this.modalAbierto.set(true);
  }

  cerrarModal() {
    this.modalAbierto.set(false);
    this.colaboradorSeleccionado.set(null);
  }

  guardarColaborador() {
    const payload = this.formulario();

    if (!payload.nombre || !payload.email || !payload.cargo) {
      alert('Completa nombre, correo y cargo para guardar el colaborador.');
      return;
    }

    if (this.modoModal() === 'edit') {
      const colaboradorActual = this.colaboradorSeleccionado();
      if (!colaboradorActual) return;

      this.http.put(`/api/colaboradores/${colaboradorActual.id}`, payload).subscribe({
        next: () => {
          this.cargarColaboradores();
          this.cargarSolicitudes();
          this.cerrarModal();
        },
        error: (err) => console.error('Error al actualizar colaborador:', err)
      });
    } else {
      this.http.post('/api/colaboradores', payload).subscribe({
        next: () => {
          this.cargarColaboradores();
          this.cerrarModal();
        },
        error: (err) => console.error('Error al crear colaborador:', err)
      });
    }
  }

  editarColaborador(id: number) {
    const colaborador = this.colaboradores().find(col => col.id === id);
    if (colaborador) {
      this.abrirModalEditar(colaborador);
    }
  }

  eliminarColaborador(id: number) {
    this.http.delete(`/api/colaboradores/${id}`).subscribe({
      next: () => {
        this.colaboradores.set(this.colaboradores().filter(col => col.id !== id));
        this.cargarSolicitudes();
      },
      error: (err) => console.error('Error al eliminar colaborador:', err)
    });
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