import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { HttpClient } from '@angular/common/http'; // <-- Importar HttpClient

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
  private http = inject(HttpClient); // <-- Inyectar HttpClient

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

      const credenciales = this.loginForm.getRawValue();

      this.http.post('/api/login', credenciales).subscribe({
        next: (respuesta: any) => {
          console.log('Login exitoso:', respuesta);
          this.isLoading.set(false);
          
          // Aquí viene la magia: Leemos el rol que manda Python
          const rol = respuesta.usuario?.rol?.toLowerCase();

          // Guardamos un pequeño rastro en localStorage (opcional pero útil)
          localStorage.setItem('usuarioRol', rol);
          localStorage.setItem('token', respuesta.token);

          // Redirigimos según el rol
          if (rol === 'colaborador') {
            this.router.navigate(['/colaborador/dashboard']);
          } else if (rol === 'administrador' || rol === 'admin') {
            this.router.navigate(['/administrador/dashboard']);
          } else {
            // Si por algún motivo no trae rol, lo mandamos al admin por defecto o muestras error
            console.warn('Rol no identificado, redirigiendo a admin por defecto');
            this.router.navigate(['/administrador/dashboard']);
          }
        },
        error: (err) => {
          console.error('Error de autenticación:', err);
          this.isLoading.set(false);
          if (err.status === 401) {
            this.errorMessage.set('Correo o contraseña incorrectos.');
          } else {
            this.errorMessage.set('Ocurrió un error al conectar con el servidor.');
          }
        }
      });

    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  irAlFormulario(): void {
    this.router.navigate(['/inicio']);
  }

  irARecuperarContra(): void {
    // Ruta hacia la página de recuperación de contraseña
    this.router.navigate(['/recuperar-contra']);

  }

  irARegistrarColaborador(): void {
    this.router.navigate(['/registro-colaborador'])
  }
}