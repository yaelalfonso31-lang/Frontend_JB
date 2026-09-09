import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-recuperar-contra',
  standalone: true,
  imports: [ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './recuperar-contra.html',
  styleUrl: './recuperar-contra.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecuperarPasswordComponent {
  private fb = inject(FormBuilder).nonNullable;
  private router = inject(Router);

  // Formulario con un solo campo validado
  recoveryForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  // Signals para el control de la interfaz
  isLoading = signal<boolean>(false);
  isSuccess = signal<boolean>(false);

  onSubmit(): void {
    if (this.recoveryForm.valid) {
      this.isLoading.set(true);

      const email = this.recoveryForm.getRawValue().email;
      console.log('Solicitando recuperación para:', email);

      // Simulación de petición al backend
      setTimeout(() => {
        this.isLoading.set(false);
        this.isSuccess.set(true);
      }, 1500);
    } else {
      this.recoveryForm.markAllAsTouched();
    }
  }

  volverAlLogin(): void {
    this.router.navigate(['/login']);
  }
}