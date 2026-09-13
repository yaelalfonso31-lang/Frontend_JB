import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
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

      // // Simulación de autenticación
      // setTimeout(() => {
      //   console.log('Autenticando...', this.loginForm.getRawValue());
      //   this.isLoading.set(false);
      //   // this.router.navigate(['/panel-admin']);
      // }, 1500);
      const { email, password } = this.loginForm.getRawValue();

      // Simulación de autenticación según el rol
      setTimeout(() => {
        this.isLoading.set(false);

        if (email.toLowerCase() === 'admin@correo.com') {
          // Redirige al Dashboard de Administrador
          this.router.navigate(['/administrador/dashboard']);
        } else if (email.toLowerCase() === 'colaborador@correo.com') {
          // Redirige a la pantalla del Colaborador
          this.router.navigate(['/programa-servicio']);
        } else {
          // Credenciales no reconocidas en el prototipo
          this.errorMessage.set('Credenciales incorrectas. Usa "admin@correo.com" o "colaborador@correo.com".');
        }
      }, 1200);
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  irAlFormulario(): void {
    // Ruta hacia la solicitud de visitas
    this.router.navigate(['/inicio']);
  }

  irARecuperarPassword(): void {
    this.router.navigate(['/recuperar-password']);
  }
}