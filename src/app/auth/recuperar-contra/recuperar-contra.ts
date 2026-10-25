import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  DestroyRef,
  OnInit,
  OnDestroy,
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
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../services/auth.service';
import { emailEstrictoValidator } from '../registro-colaborador/registro-colaborador';

export const passwordsMatchValidator: ValidatorFn = (
  group: AbstractControl
): ValidationErrors | null => {
  const pass = group.get('nuevaPassword')?.value;
  const confirm = group.get('confirmarPassword')?.value;
  return pass && confirm && pass === confirm ? null : { mismatch: true };
};

@Component({
  selector: 'app-recuperar-contra',
  standalone: true,
  imports: [ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './recuperar-contra.html',
  styleUrl: './recuperar-contra.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecuperarContraComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  readonly currentStep = signal<1 | 2 | 3 | 4>(1);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly reenviandoEn = signal(0);
  private countdownInterval?: ReturnType<typeof setInterval>;

  readonly mostrarPassword = signal(false);
  readonly mostrarConfirm = signal(false);

  readonly step1Form = this.fb.nonNullable.group({
    email: ['', [Validators.required, emailEstrictoValidator]],
  });

  readonly step2Form = this.fb.nonNullable.group({
    d1: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    d2: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    d3: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    d4: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    d5: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    d6: ['', [Validators.required, Validators.pattern(/^\d$/)]],
  });

  readonly step3Form = this.fb.nonNullable.group(
    {
      nuevaPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmarPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator }
  );

  // Signal reactivo para que la barra de fortaleza funcione en tiempo real
  readonly nuevaPasswordValue = toSignal(
    this.step3Form.controls.nuevaPassword.valueChanges,
    { initialValue: '' }
  );

  readonly fortaleza = computed(() => {
    const pass = this.nuevaPasswordValue();
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

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.detenerCountdown();
  }

  private obtenerCodigoActual(): string {
    const raw = this.step2Form.getRawValue();
    return `${raw.d1}${raw.d2}${raw.d3}${raw.d4}${raw.d5}${raw.d6}`;
  }

  private extraerError(err: any, porDefecto: string): string {
    return (
      err?.error?.detail?.message ||
      (typeof err?.error?.detail === 'string' ? err.error.detail : null) ||
      err?.error?.message ||
      porDefecto
    );
  }

  enviarCodigo(): void {
    if (this.step1Form.invalid) {
      this.step1Form.markAllAsTouched();
      return;
    }

    if (this.isLoading()) return;
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const email = this.step1Form.controls.email.value.trim();

    this.authService
      .solicitarCodigo(email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.currentStep.set(2);
          this.iniciarCountdown(30);
          if (res?.codigo_debug) {
            alert(`Código de verificación generado: ${res.codigo_debug}`);
          }
          setTimeout(() => document.getElementById('otp-1')?.focus(), 50);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            this.extraerError(err, 'No pudimos enviar el código. Verifica que el correo esté registrado.')
          );
        },
      });
  }

  validarCodigo(): void {
    if (this.step2Form.invalid) {
      this.step2Form.markAllAsTouched();
      return;
    }

    if (this.isLoading()) return;
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const codigo = this.obtenerCodigoActual();

    this.authService
      .validarCodigo(this.step1Form.controls.email.value.trim(), codigo)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.currentStep.set(3);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            this.extraerError(err, 'El código es incorrecto o ya expiró.')
          );
        },
      });
  }

  onOtpInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');
    input.value = value.slice(-1);
    this.step2Form.controls[`d${index}` as keyof typeof this.step2Form.controls].setValue(input.value);

    if (input.value && index < 6) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  }

  onOtpKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace') {
      const input = event.target as HTMLInputElement;
      if (!input.value && index > 1) {
        document.getElementById(`otp-${index - 1}`)?.focus();
      }
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text')?.replace(/\D/g, '') ?? '';
    if (text.length < 6) return;

    for (let i = 0; i < 6; i++) {
      this.step2Form.controls[`d${i + 1}` as keyof typeof this.step2Form.controls].setValue(text[i]);
    }
    document.getElementById('otp-6')?.focus();
  }

  actualizarPassword(): void {
    if (this.step3Form.invalid) {
      this.step3Form.markAllAsTouched();
      return;
    }

    if (this.isLoading()) return;
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const nueva = this.step3Form.controls.nuevaPassword.value;

    this.authService
      .restablecerPassword(
        this.step1Form.controls.email.value.trim(),
        this.obtenerCodigoActual(),
        nueva
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.currentStep.set(4);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            this.extraerError(err, 'No pudimos actualizar la contraseña.')
          );
        },
      });
  }

  volverPaso(paso: 1 | 2 | 3): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.currentStep.set(paso);
  }

  irAlLogin(): void {
    this.router.navigate(['/login']);
  }

  reenviarCodigo(): void {
    if (this.reenviandoEn() > 0 || this.isLoading()) return;
    this.enviarCodigo();
  }

  private iniciarCountdown(segundos: number): void {
    this.detenerCountdown();
    this.reenviandoEn.set(segundos);

    this.countdownInterval = setInterval(() => {
      const actual = this.reenviandoEn() - 1;
      if (actual <= 0) {
        this.reenviandoEn.set(0);
        this.detenerCountdown();
      } else {
        this.reenviandoEn.set(actual);
      }
    }, 1000);
  }

  private detenerCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = undefined;
    }
  }
}