import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface DiaFestivo {
  id: number;
  fecha: string;
  nombre: string;
}

@Component({
  selector: 'app-configuracion-sistema',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './configuracion-sistema.html',
  styleUrl: './configuracion-sistema.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfiguracionSistemaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  limiteVisitantes = signal(100);
  diasFestivos = signal<DiaFestivo[]>([]);
  mostrarFormularioDia = signal(false);

  configForm = this.fb.nonNullable.group({
    limiteVisitantes: [100, [Validators.required, Validators.min(1)]]
  });

  diaFestivoForm = this.fb.nonNullable.group({
    fecha: ['', Validators.required],
    nombre: ['', Validators.required]
  });

  ngOnInit(): void {
    this.cargarConfiguracion();
  }

  cargarConfiguracion(): void {
    this.http.get<{ limiteVisitantes: number; diasFestivos: DiaFestivo[] }>('/api/configuracion')
      .subscribe({
        next: (data) => {
          this.limiteVisitantes.set(data.limiteVisitantes || 100);
          this.configForm.patchValue({ limiteVisitantes: data.limiteVisitantes || 100 });
          this.diasFestivos.set(data.diasFestivos || []);
        },
        error: (err) => console.error('Error al cargar configuración:', err)
      });
  }

  guardarConfiguracion(): void {
    if (this.configForm.valid) {
      const valor = this.configForm.get('limiteVisitantes')?.value;
      if (valor !== undefined && typeof valor === 'number') {
        this.http.put('/api/configuracion', { limiteVisitantes: valor }).subscribe({
          next: () => {
            this.limiteVisitantes.set(valor);
            alert('Configuración guardada exitosamente en la base de datos.');
          },
          error: (err) => console.error('Error al guardar configuración:', err)
        });
      }
    }
  }

  abrirFormularioDia(): void {
    this.mostrarFormularioDia.set(true);
  }

  cerrarFormularioDia(): void {
    this.mostrarFormularioDia.set(false);
    this.diaFestivoForm.reset();
  }

  agregarDiaFestivo(): void {
    if (this.diaFestivoForm.valid) {
      const payload = {
        fecha: this.diaFestivoForm.get('fecha')?.value || '',
        nombre: this.diaFestivoForm.get('nombre')?.value || ''
      };

      this.http.post<DiaFestivo>('/api/configuracion/dias-festivos', payload).subscribe({
        next: () => {
          this.cargarConfiguracion();
          this.cerrarFormularioDia();
        },
        error: (err) => console.error('Error al agregar día festivo:', err)
      });
    }
  }

  eliminarDiaFestivo(id: number): void {
    this.http.delete(`/api/configuracion/dias-festivos/${id}`).subscribe({
      next: () => {
        this.diasFestivos.update(dias => dias.filter(d => d.id !== id));
      },
      error: (err) => console.error('Error al eliminar día festivo:', err)
    });
  }
}