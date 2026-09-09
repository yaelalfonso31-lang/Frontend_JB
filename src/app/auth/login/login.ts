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

      // Petición HTTP al backend usando ruta relativa
      this.http.post('/api/login', credenciales).subscribe({
        next: (respuesta: any) => {
          console.log('Login exitoso:', respuesta);
          this.isLoading.set(false);
          // Redirigir al panel de administración si el login es exitoso
          this.router.navigate(['/panel-admin']); 
        },
        error: (err) => {
          console.error('Error de autenticación:', err);
          this.isLoading.set(false);
          // Mostrar mensaje de error en el HTML
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
}