import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

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
export class ConfiguracionSistemaComponent {
  private fb = inject(FormBuilder);

  // Estado de configuración
  limiteVisitantes = signal(100);
  diasFestivos = signal<DiaFestivo[]>([
    { id: 1, fecha: '2024-12-25', nombre: 'Navidad' },
    { id: 2, fecha: '2024-01-01', nombre: 'Año Nuevo' },
    { id: 3, fecha: '2024-12-08', nombre: 'Inmaculada Concepción' }
  ]);

  // Formularios
  configForm = this.fb.nonNullable.group({
    limiteVisitantes: [100, [Validators.required, Validators.min(1)]]
  });

  diaFestivoForm = this.fb.nonNullable.group({
    fecha: ['', Validators.required],
    nombre: ['', Validators.required]
  });

  mostrarFormularioDia = signal(false);

  constructor() {
    this.configForm.patchValue({
      limiteVisitantes: this.limiteVisitantes()
    });
  }

  ngOnInit() {
    // Inicialización si es necesario
  }

  guardarConfiguracion() {
    if (this.configForm.valid) {
      const valor = this.configForm.get('limiteVisitantes')?.value;
      if (valor !== undefined && typeof valor === 'number') {
        this.limiteVisitantes.set(valor);
        console.log('Configuración guardada:', { limiteVisitantes: valor });
        alert('Configuración guardada exitosamente');
      }
    }
  }

  abrirFormularioDia() {
    this.mostrarFormularioDia.set(true);
  }

  cerrarFormularioDia() {
    this.mostrarFormularioDia.set(false);
    this.diaFestivoForm.reset();
  }

  agregarDiaFestivo() {
    if (this.diaFestivoForm.valid) {
      const nuevoId =
        this.diasFestivos().length > 0
          ? Math.max(...this.diasFestivos().map(d => d.id)) + 1
          : 1;

      const nuevoDia: DiaFestivo = {
        id: nuevoId,
        fecha: this.diaFestivoForm.get('fecha')?.value || '',
        nombre: this.diaFestivoForm.get('nombre')?.value || ''
      };

      this.diasFestivos.update(dias => [...dias, nuevoDia]);
      this.cerrarFormularioDia();
      console.log('Día festivo agregado:', nuevoDia);
    }
  }

  eliminarDiaFestivo(id: number) {
    this.diasFestivos.update(dias => dias.filter(d => d.id !== id));
    console.log('Día festivo eliminado:', id);
  }
}

import { inject } from '@angular/core';
