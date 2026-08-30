import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
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

  currentStep = signal<number>(1);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  step1Form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  step2Form = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern('^[0-9]+$')]]
  });

  step3Form = this.fb.nonNullable.group({
    nuevaPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmarPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const pass = group.get('nuevaPassword')?.value;
    const confirmPass = group.get('confirmarPassword')?.value;
    return pass === confirmPass ? null : { mismatch: true };
  }

  enviarCodigo(): void {
    if (this.step1Form.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      setTimeout(() => {
        console.log('Código enviado a:', this.step1Form.value.email);
        this.isLoading.set(false);
        this.currentStep.set(2);
      }, 1200);
    } else {
      this.step1Form.markAllAsTouched();
    }
  }

  validarCodigo(): void {
    if (this.step2Form.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      setTimeout(() => {
        console.log('Código validado:', this.step2Form.value.codigo);
        this.isLoading.set(false);
        this.currentStep.set(3);
      }, 1000);
    } else {
      this.step2Form.markAllAsTouched();
    }
  }

  actualizarPassword(): void {
    if (this.step3Form.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      setTimeout(() => {
        console.log('Contraseña actualizada con éxito');
        this.isLoading.set(false);
        this.currentStep.set(4);
      }, 1200);
    } else {
      this.step3Form.markAllAsTouched();
    }
  }

  volverPaso(paso: number): void {
    this.errorMessage.set(null);
    this.currentStep.set(paso);
  }

  irAlLogin(): void {
    this.router.navigate(['/login']);
  }
}