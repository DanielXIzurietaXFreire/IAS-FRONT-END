import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loading = false;
  showPassword = false;
  errorMessage = '';
  shake = false;

  readonly loginForm = this.formBuilder.nonNullable.group({
    // El backend exige un correo ([EmailAddress] en LoginRequest), así que el formulario
    // lo valida aquí también: antes solo comprobaba que no estuviera vacío y la pantalla
    // pedía «Usuario» (08/10/2026).
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  submit(): void {
    this.errorMessage = '';
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.triggerShake();
      return;
    }

    this.shake = false;
    this.loading = true;
    const { email, password } = this.loginForm.getRawValue();
    this.authService.login(email.trim(), password.trim()).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No se pudo iniciar sesión. Verifica tus credenciales.';
        this.triggerShake();
      }
    });
  }

  private triggerShake(): void {
    this.shake = true;
    window.setTimeout(() => {
      this.shake = false;
    }, 400);
  }
}
