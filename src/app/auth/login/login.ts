import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      // Simulación de autenticación
      setTimeout(() => {
        console.log('Autenticando...', this.loginForm.getRawValue());
        this.isLoading.set(false);
        // this.router.navigate(['/panel-admin']);
      }, 1500);
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  irAlFormulario(): void {
    // Ruta hacia la solicitud de visitas
    this.router.navigate(['/solicitud-visita']);
  }
}