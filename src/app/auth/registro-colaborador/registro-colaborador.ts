import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-registro-colaborador',
  standalone: true,
  imports: [ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './registro-colaborador.html',
  styleUrl: './registro-colaborador.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistroColaboradorComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  isLoading = signal<boolean>(false);
  isRegistered = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  registerForm = this.fb.nonNullable.group({
    nombreCompleto: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    mensajeNota: [''] // Campo opcional
  });

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      // Simulación de guardado de datos del colaborador
      setTimeout(() => {
        console.log('Registro de colaborador enviado:', this.registerForm.getRawValue());
        this.isLoading.set(false);
        this.isRegistered.set(true); // Cambia a la pantalla de aviso de espera
      }, 1200);
    } else {
      this.registerForm.markAllAsTouched();
    }
  }

  irAlLogin(): void {
    this.router.navigate(['/login']);
  }
}