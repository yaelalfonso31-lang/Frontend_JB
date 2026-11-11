import { Component, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router'; 

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './footer.html',
  styleUrls: ['./footer.scss']
})
export class FooterComponent {
  private router = inject(Router); // Inyectar Router

  /* ---------- Navegación ---------- */
  irAReglamentoJardin(): void {
    this.router.navigate(['/reglamento-jardin']);
  }

  /* ---------- Estado del formulario ---------- */
  email = '';
  emailTouched = false;

  /* ---------- Estado de envío ---------- */
  enviando = signal(false);
  mensajeExito = signal(false);

  /* ---------- Año dinámico ---------- */
  readonly anioActual = new Date().getFullYear();

  /* ---------- Validación en vivo ---------- */
  readonly emailValido = computed(() => {
    const value = this.email.trim();
    if (!value) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  });

  /* ---------- Submit ---------- */
  onSubmit(event: Event): void {
    event.preventDefault();
    this.emailTouched = true;

    if (!this.emailValido() || this.enviando()) return;

    this.enviando.set(true);
    this.mensajeExito.set(false);

    // TODO: reemplaza este setTimeout por tu llamada real al backend
    setTimeout(() => {
      this.enviando.set(false);
      this.mensajeExito.set(true);
      this.email = '';
      this.emailTouched = false;

      // Auto-oculta el mensaje después de 4s
      setTimeout(() => this.mensajeExito.set(false), 4000);
    }, 800);
  }
}