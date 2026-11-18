import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface DiaFestivo {
  id: number;
  fecha: string;
  nombre: string;
}

const STORAGE_CONFIG_KEY = 'jbuap_config_mock';

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

  readonly fechaActual = new Date();
  limiteVisitantes = signal(100);
  diasFestivos = signal<DiaFestivo[]>([]);
  mostrarFormularioDia = signal(false);
  mensajeGuardado = signal('');

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
        error: () => {
          // Respaldo local cuando el backend está apagado
          const local = localStorage.getItem(STORAGE_CONFIG_KEY);
          if (local) {
            const parsed = JSON.parse(local);
            this.limiteVisitantes.set(parsed.limiteVisitantes || 100);
            this.configForm.patchValue({ limiteVisitantes: parsed.limiteVisitantes || 100 });
            this.diasFestivos.set(parsed.diasFestivos || []);
          } else {
            this.diasFestivos.set([
              { id: 1, fecha: '2026-11-16', nombre: 'Aniversario de la Revolución Mexicana (Puente)' },
              { id: 2, fecha: '2026-12-25', nombre: 'Suspensión de labores - Navidad' }
            ]);
          }
        }
      });
  }

  guardarConfiguracion(): void {
    if (this.configForm.valid) {
      const valor = this.configForm.get('limiteVisitantes')?.value;
      if (valor !== undefined && typeof valor === 'number') {
        this.http.put('/api/configuracion', { limiteVisitantes: valor }).subscribe({
          next: () => {
            this.limiteVisitantes.set(valor);
            this.mostrarToast('Límite de visitantes actualizado correctamente.');
          },
          error: () => {
            this.limiteVisitantes.set(valor);
            this.guardarRespaldoLocal();
            this.mostrarToast('Configuración guardada localmente (modo sin conexión).');
          }
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
        nombre: this.diaFestivoForm.get('nombre')?.value.trim() || ''
      };

      this.http.post<DiaFestivo>('/api/configuracion/dias-festivos', payload).subscribe({
        next: () => {
          this.cargarConfiguracion();
          this.cerrarFormularioDia();
          this.mostrarToast('Fecha bloqueada agregada exitosamente.');
        },
        error: () => {
          const nuevoDia: DiaFestivo = {
            id: Date.now(),
            fecha: payload.fecha,
            nombre: payload.nombre
          };
          this.diasFestivos.update(dias => [...dias, nuevoDia].sort((a, b) => a.fecha.localeCompare(b.fecha)));
          this.guardarRespaldoLocal();
          this.cerrarFormularioDia();
          this.mostrarToast('Fecha bloqueada registrada localmente.');
        }
      });
    }
  }

  eliminarDiaFestivo(id: number): void {
    this.http.delete(`/api/configuracion/dias-festivos/${id}`).subscribe({
      next: () => {
        this.diasFestivos.update(dias => dias.filter(d => d.id !== id));
        this.mostrarToast('Fecha desbloqueada correctamente.');
      },
      error: () => {
        this.diasFestivos.update(dias => dias.filter(d => d.id !== id));
        this.guardarRespaldoLocal();
        this.mostrarToast('Fecha eliminada localmente.');
      }
    });
  }

  private guardarRespaldoLocal(): void {
    localStorage.setItem(
      STORAGE_CONFIG_KEY,
      JSON.stringify({
        limiteVisitantes: this.limiteVisitantes(),
        diasFestivos: this.diasFestivos()
      })
    );
  }

  private mostrarToast(mensaje: string): void {
    this.mensajeGuardado.set(mensaje);
    setTimeout(() => this.mensajeGuardado.set(''), 3500);
  }
}