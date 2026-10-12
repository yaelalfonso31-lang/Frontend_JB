import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import { AuthService } from '../services/auth.service';

/* ==========================================================================
   Validador de coincidencia (función pura)
   ========================================================================== */
export const passwordsMatchValidator: ValidatorFn = (
  group: AbstractControl
): ValidationErrors | null => {
  const pass = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pass && confirm && pass === confirm ? null : { mismatch: true };
};

/* ==========================================================================
   VALIDADORES PERSONALIZADOS (Funciones puras)
   ========================================================================== */
//Validador de Nombre completo
export const nombreCompletoValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value?.trim();
  
  if (!value) return null; // Deja que Validators.required maneje el campo vacío

  // 1. Debe incluir al menos Nombre y Apellido (mínimo 2 palabras)
  const palabras = value.split(/\s+/);
  if (palabras.length < 2) {
    return { faltaApellido: true };
  }

  // 2. Solo letras en español y espacios simples entre palabras (evita dobles espacios)
  const regexNombreValido = /^[A-Za-zÁÉÍÓÚÑáéíóúñ]+(\s[A-Za-zÁÉÍÓÚÑáéíóúñ]+)+$/;
  if (!regexNombreValido.test(value)) {
    return { nombreInvalido: true };
  }

  return null; // Si todo está bien, no hay error
};

//Validaddor de correo electronico
export const emailEstrictoValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const value = control.value?.trim();
  if (!value) return null; // Deja que Validators.required maneje el campo vacío

  // Exige: texto + @ + dominio + . + extensión de mínimo 2 letras (ej. .com, .mx, .edu.mx)
  const regexEmailValido = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  return regexEmailValido.test(value) ? null : { emailInvalido: true };
};

@Component({
  selector: 'app-registro-colaborador',
  standalone: true,
  imports: [ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './registro-colaborador.html',
  styleUrl: './registro-colaborador.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistroColaboradorComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  /* ---------- Estado general ---------- */
  readonly isLoading = signal(false);
  readonly isRegistered = signal(false);
  readonly errorMessage = signal<string | null>(null);

  /* ---------- Mostrar/ocultar passwords ---------- */
  readonly mostrarPassword = signal(false);
  readonly mostrarConfirm = signal(false);

  /* ---------- Formulario ---------- */
  readonly registerForm = this.fb.nonNullable.group(
    {
      nombreCompleto: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          nombreCompletoValidator // Validador personalizado
        ],
      ],
      email: ['', [Validators.required, emailEstrictoValidator ]],
      rol: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      mensajeNota: [''],
      aceptaTerminos: [false, Validators.requiredTrue],
    },
    { validators: passwordsMatchValidator }
  );

  /* Signal reactivo vinculado al valor del campo password */
  readonly passwordValue = toSignal(
    this.registerForm.controls.password.valueChanges,
    { initialValue: '' }
  );

  /* ---------- Catálogo de roles ---------- */
  readonly roles = [
    { value: 'guia', label: 'Guía del jardín', icon: 'fa-leaf' },
    { value: 'educador', label: 'Educador ambiental', icon: 'fa-chalkboard-user' },
    { value: 'mantenimiento', label: 'Mantenimiento', icon: 'fa-trowel' },
    { value: 'administrativo', label: 'Administrativo', icon: 'fa-briefcase' },
    { value: 'practicante', label: 'Practicante / Servicio social', icon: 'fa-graduation-cap' },
    { value: 'otro', label: 'Otro', icon: 'fa-circle-question' },
  ];

  /* ---------- Fortaleza de contraseña ---------- */
  readonly fortaleza = computed(() => {
    const pass = this.passwordValue(); // <-- Rastreo de los cambios en tiempo real
    if (!pass) return { nivel: 0, texto: '', clase: '' };

    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.length >= 12) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/\d/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) return { nivel: 1, texto: 'Débil', clase: 'weak' };
    if (score <= 4) return { nivel: 2, texto: 'Aceptable', clase: 'medium' };
    return { nivel: 3, texto: 'Fuerte', clase: 'strong' };
  });

  /* ========================================================================
     SUBMIT
     ======================================================================== */
  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { nombreCompleto, email, password, rol, mensajeNota } =
      this.registerForm.getRawValue();

    this.authService
      .registrarColaborador(nombreCompleto, email, password, rol, mensajeNota)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.isRegistered.set(true);
          // Nunca loggear el form completo — contiene la contraseña
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            err?.error?.message ?? 'No pudimos completar tu registro. Intenta de nuevo.'
          );
        },
      });
  }

  /* ========================================================================
     NAVEGACIÓN
     ======================================================================== */
  irAlLogin(): void {
    this.router.navigate(['/login']);
  }

}
