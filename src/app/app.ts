import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ApiService } from './core/services/api.service';
import { AuthService } from './features/auth/services/auth.service';
import { PermissionService } from './core/services/permission.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private readonly apiService = inject(ApiService);
  readonly authService = inject(AuthService);
  readonly permissionService = inject(PermissionService);

  statusMessage = signal<string>('Consultando al backend...');
  errorMessage = signal<string | null>(null);
  menuOpen = signal<boolean>(false);

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  ngOnInit(): void {
    this.permissionService.loadMyPermissions();

    this.apiService.getHealthStatus().subscribe({
      next: (response: string) => {
        this.statusMessage.set(response);
        this.errorMessage.set(null);
      },
      error: (err: { status?: number }) => {
        this.statusMessage.set('Sin conexión con el backend');
        this.errorMessage.set(`Error HTTP ${err.status ?? ''}: verifica CORS o que el servidor esté activo.`);
      }
    });
  }
}