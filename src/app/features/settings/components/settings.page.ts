import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SystemSetting } from '../../../shared/models/logistics.model';
import { ModulePermissionDto, PermissionService } from '../../../core/services/permission.service';

export interface SystemUserDto {
  id: number;
  username: string;
  role: string;
  fullName?: string;
  email?: string;
  active?: boolean;
  lastLoginAt?: string;
}

@Component({
  selector: 'app-settings-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.css'
})
export class SettingsPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly permissionService = inject(PermissionService);
  private readonly apiUrl = 'http://localhost:8080/api/settings';

  section = signal<'USERS' | 'PEDIDOS' | 'INVENTARIO' | 'ALMACENES' | 'COMPRAS'>('USERS');
  users = signal<SystemUserDto[]>([]);
  inactiveOnly = signal(false);
  selectedUser = signal<SystemUserDto | null>(null);
  userPermissions = signal<ModulePermissionDto[]>([]);

  settings = signal<SystemSetting[]>([]);
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  newSettingKey = 'MONEDA';
  newSettingValue = '';
  newSettingDesc = '';
  twoFactorSimulated = false;

  readonly modulesList = ['INICIO', 'PEDIDOS', 'INVENTARIO', 'ALMACENES', 'COMPRAS', 'CONFIGURACION'];

  filteredSettings = computed(() =>
    this.settings().filter((s) => (s.moduleKey || '').toUpperCase() === this.section())
  );

  ngOnInit(): void {
    this.loadUsers();
    this.loadSettings();
  }

  selectSection(sec: 'USERS' | 'PEDIDOS' | 'INVENTARIO' | 'ALMACENES' | 'COMPRAS'): void {
    this.section.set(sec);
    this.errorMsg.set(null);
    this.successMsg.set(null);
    if (sec === 'COMPRAS') this.newSettingKey = 'MONEDA';
    else if (sec === 'INVENTARIO') this.newSettingKey = 'CATEGORIA';
    else if (sec === 'ALMACENES') this.newSettingKey = 'REGLA_ALMACEN';
    else if (sec === 'PEDIDOS') this.newSettingKey = 'REGLA_PEDIDO';
  }

  loadUsers(): void {
    const flag = this.inactiveOnly();
    this.http.get<SystemUserDto[]>(`${this.apiUrl}/users?inactiveOnly=${flag}`).subscribe({
      next: (list) => this.users.set(list ?? []),
      error: () => this.errorMsg.set('No se pudieron cargar los usuarios.')
    });
  }

  toggleInactiveFilter(): void {
    this.inactiveOnly.update((v) => !v);
    this.loadUsers();
  }

  selectUserForPermissions(user: SystemUserDto): void {
    this.selectedUser.set(user);
    this.http.get<ModulePermissionDto[]>(`${this.apiUrl}/users/${user.id}/permissions`).subscribe({
      next: (perms) => {
        const mapped = this.modulesList.map((mod) => {
          const existing = (perms ?? []).find((p) => p.moduleKey.toUpperCase() === mod);
          return (
            existing ?? {
              moduleKey: mod,
              canView: user.role === 'ADMIN_ALMACEN' || mod === 'INICIO',
              canCreate: user.role === 'ADMIN_ALMACEN',
              canEdit: user.role === 'ADMIN_ALMACEN',
              canDelete: user.role === 'ADMIN_ALMACEN'
            }
          );
        });
        this.userPermissions.set(mapped);
      },
      error: () => this.errorMsg.set('No se pudieron cargar los permisos del usuario.')
    });
  }

  savePermissionRow(perm: ModulePermissionDto): void {
    const user = this.selectedUser();
    if (!user) return;

    this.http.put<ModulePermissionDto>(`${this.apiUrl}/users/${user.id}/permissions`, perm).subscribe({
      next: () => {
        this.successMsg.set(`Permiso de ${perm.moduleKey} guardado para ${user.username}.`);
        this.permissionService.loadMyPermissions();
      },
      error: () => this.errorMsg.set('No se pudo guardar el permiso.')
    });
  }

  loadSettings(): void {
    this.http.get<SystemSetting[]>(this.apiUrl).subscribe({
      next: (list) => this.settings.set(list ?? []),
      error: () => {}
    });
  }

  addSetting(): void {
    if (!this.newSettingValue.trim() || this.section() === 'USERS') return;
    const payload: SystemSetting = {
      moduleKey: this.section(),
      settingKey: this.newSettingKey.trim().toUpperCase(),
      settingValue: this.newSettingValue.trim(),
      description: this.newSettingDesc.trim() || undefined
    };

    this.http.post<SystemSetting>(this.apiUrl, payload).subscribe({
      next: () => {
        this.successMsg.set('Parámetro agregado.');
        this.newSettingValue = '';
        this.newSettingDesc = '';
        this.loadSettings();
      },
      error: () => this.errorMsg.set('No se pudo agregar el parámetro (verifica que no esté duplicado).')
    });
  }

  deleteSetting(id: number): void {
    this.http.delete<void>(`${this.apiUrl}/${id}`).subscribe({
      next: () => {
        this.successMsg.set('Parámetro eliminado.');
        this.loadSettings();
      },
      error: () => this.errorMsg.set('No se pudo eliminar el parámetro.')
    });
  }
}