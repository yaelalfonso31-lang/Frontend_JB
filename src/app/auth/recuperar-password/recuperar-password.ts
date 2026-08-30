import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-recuperar-password',
  standalone: true,
  imports: [ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './recuperar-password.html',
  styleUrl: './recuperar-password.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecuperarPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  recoveryForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  isLoading = signal<boolean>(false);
  isEmailSent = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  onSubmit(): void {
    if (this.recoveryForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      // Simulación de envío de correo
      setTimeout(() => {
        console.log('Enviando enlace a:', this.recoveryForm.getRawValue().email);
        this.isLoading.set(false);
        this.isEmailSent.set(true);
      }, 1500);
    } else {
      this.recoveryForm.markAllAsTouched();
    }
  }

  irAlLogin(): void {
    // Cambio de pantalla hacia la vista de Login
    this.router.navigate(['/auth/login']);
  }
}