import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../features/auth/services/auth.service';

export type AppModuleKey =
  | 'INICIO'
  | 'PEDIDOS'
  | 'INVENTARIO'
  | 'ALMACENES'
  | 'COMPRAS'
  | 'CONFIGURACION';

export interface ModulePermissionDto {
  moduleKey: AppModuleKey | string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly customPermissions = signal<ModulePermissionDto[]>([]);

  readonly allowedModules = computed<Set<string>>(() => {
    const role = (this.authService.currentRole() || '').toUpperCase();
    const custom = this.customPermissions();

    if (custom.length > 0) {
      const set = new Set<string>(['INICIO']);
      for (const p of custom) {
        if (p.canView) {
          set.add(p.moduleKey.toUpperCase());
        }
      }
      return set;
    }

    if (role === 'ADMIN_ALMACEN') {
      return new Set(['INICIO', 'PEDIDOS', 'INVENTARIO', 'ALMACENES', 'COMPRAS', 'CONFIGURACION']);
    }
    if (role === 'VENDEDOR') {
      return new Set(['INICIO', 'PEDIDOS', 'INVENTARIO', 'ALMACENES']);
    }
    if (role === 'INVITADO') {
      return new Set(['INICIO', 'INVENTARIO']);
    }

    return new Set(['INICIO']);
  });

  loadMyPermissions(): void {
    const token = this.authService.getToken();
    if (!token) {
      this.customPermissions.set([]);
      return;
    }

    this.http.get<ModulePermissionDto[]>('http://localhost:8080/api/settings/my-permissions').subscribe({
      next: (list) => this.customPermissions.set(list ?? []),
      error: () => this.customPermissions.set([])
    });
  }

  canView(moduleKey: AppModuleKey): boolean {
    return this.allowedModules().has(moduleKey);
  }
}