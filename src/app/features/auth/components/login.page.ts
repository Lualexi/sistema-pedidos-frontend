import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule],
  template: `
    <section class="auth-wrapper">
      <div class="auth-card">
        <div class="auth-header">
          <span class="auth-badge">Seguridad JWT</span>
          <h2>Iniciar sesión</h2>
          <p>Accede al sistema logístico de Distribuciones C&amp;M con tu cuenta.</p>
        </div>

        @if (authService.isLoggedIn()) {
          <div class="session-box">
            <div>
              <strong>Sesión activa:</strong> {{ authService.currentUsername() || 'Usuario' }}
              <div class="session-role">Perfil / Rol: <span>{{ authService.currentRole() }}</span></div>
            </div>
            <button type="button" class="btn-outline" (click)="onLogout()">Cerrar sesión</button>
          </div>
        }

        <form (ngSubmit)="onSubmit()" class="auth-form" #loginForm="ngForm">
          <div class="field">
            <label for="username">Usuario</label>
            <input
              id="username"
              name="username"
              type="text"
              required
              [(ngModel)]="username"
              placeholder="Ej. admin"
              [disabled]="loading()"
            />
          </div>

          <div class="field">
            <label for="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              [(ngModel)]="password"
              placeholder="••••••••"
              [disabled]="loading()"
            />
          </div>

          @if (errorMsg()) {
            <div class="alert alert--error">{{ errorMsg() }}</div>
          }

          @if (successMsg()) {
            <div class="alert alert--success">{{ successMsg() }}</div>
          }

          <button type="submit" class="btn-submit" [disabled]="loading()">
            {{ loading() ? 'Validando credenciales...' : 'Ingresar al sistema' }}
          </button>
        </form>
      </div>
    </section>
  `,
  styles: [`
    .auth-wrapper {
      display: flex;
      justify-content: center;
      padding-top: 0.75rem;
    }
    .auth-card {
      width: 100%;
      max-width: 440px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 1.75rem;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
    }
    .auth-badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 600;
      color: #c2410c;
      background: #fff7ed;
      border: 1px solid #fed7aa;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      margin-bottom: 0.6rem;
    }
    h2 { margin: 0; font-size: 1.35rem; color: #0f172a; }
    .auth-header p { margin: 0.35rem 0 1.25rem; color: #64748b; font-size: 0.9rem; }

    .session-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 0.85rem;
      margin-bottom: 1.25rem;
      font-size: 0.88rem;
    }
    .session-role { color: #475569; margin-top: 0.2rem; }
    .session-role span { font-weight: 700; color: #c2410c; }

    .auth-form { display: flex; flex-direction: column; gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: 0.35rem; }
    label { font-size: 0.88rem; font-weight: 600; color: #334155; }
    input {
      padding: 0.65rem 0.8rem;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 0.95rem;
      outline: none;
    }
    input:focus {
      border-color: #ea580c;
      box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.12);
    }

    .btn-submit {
      margin-top: 0.25rem;
      padding: 0.75rem 1rem;
      border: none;
      border-radius: 10px;
      background: #ea580c;
      color: #ffffff;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
    }
    .btn-submit:hover:not(:disabled) { background: #c2410c; }
    .btn-submit:disabled { opacity: 0.65; cursor: not-allowed; }

    .btn-outline {
      padding: 0.45rem 0.75rem;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #1e293b;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-outline:hover { background: #f1f5f9; }

    .alert {
      padding: 0.7rem 0.85rem;
      border-radius: 10px;
      font-size: 0.86rem;
      font-weight: 500;
    }
    .alert--error {
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }
    .alert--success {
      background: #f0fdf4;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }
  `]
})
export class LoginPage {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  username = '';
  password = '';
  loading = signal(false);
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  onSubmit(): void {
    this.errorMsg.set(null);
    this.successMsg.set(null);

    if (!this.username.trim() || !this.password.trim()) {
      this.errorMsg.set('Ingresa tu usuario y contraseña.');
      return;
    }

    this.loading.set(true);
    this.authService.login({ username: this.username.trim(), password: this.password }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.successMsg.set(`Acceso concedido. Rol detectado: ${res.role}`);
        this.password = '';
        setTimeout(() => {
          this.router.navigate(['/inventario']);
        }, 500);
      },
      error: (err: { status?: number }) => {
        this.loading.set(false);
        if (err.status === 401 || err.status === 403) {
          this.errorMsg.set('Credenciales incorrectas. Verifica tu usuario y contraseña.');
        } else {
          this.errorMsg.set('No se pudo completar el inicio de sesión con el servidor.');
        }
      }
    });
  }

  onLogout(): void {
    this.authService.logout();
    this.successMsg.set('Sesión cerrada correctamente.');
    this.errorMsg.set(null);
  }
}