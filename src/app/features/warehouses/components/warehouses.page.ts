import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouteTariff, Vehicle } from '../../../shared/models/logistics.model';
import { InventoryMovement } from '../../../shared/models/product.model';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-warehouses-page',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="wh-header">
      <div>
        <h2>Almacenes, Flota y Tarifas de Trayecto</h2>
        <p class="subtitle">Administración de unidades de transporte, tarifas ida/vuelta y trazabilidad WMS.</p>
      </div>
      <div class="tabs">
        <button type="button" class="tab-btn" [class.active]="activeTab() === 'FLEET'" (click)="activeTab.set('FLEET')">
          🚚 Flota ({{ vehicles().length }})
        </button>
        <button type="button" class="tab-btn" [class.active]="activeTab() === 'TARIFFS'" (click)="activeTab.set('TARIFFS')">
          🗺️ Tarifas ({{ tariffs().length }})
        </button>
        <button type="button" class="tab-btn" [class.active]="activeTab() === 'WMS'" (click)="activeTab.set('WMS')">
          📦 Operación WMS / Kardex
        </button>
      </div>
    </section>

    @if (errorMsg()) {
      <div class="alert alert--error">{{ errorMsg() }}</div>
    }
    @if (successMsg()) {
      <div class="alert alert--success">{{ successMsg() }}</div>
    }

    @if (activeTab() === 'FLEET') {
      <section class="grid-2">
        @if (isAdmin()) {
          <article class="panel">
            <h3>Registrar vehículo</h3>
            <form (ngSubmit)="createVehicle()" class="form-stack">
              <div class="row-2">
                <div class="field">
                  <label>Placa *</label>
                  <input type="text" name="plate" required [(ngModel)]="newVehicle.plate" placeholder="Ej. ABC-123" />
                </div>
                <div class="field">
                  <label>Unidad / Modelo *</label>
                  <input type="text" name="vname" required [(ngModel)]="newVehicle.name" placeholder="Ej. Furgón 3.5T" />
                </div>
              </div>
              <div class="row-2">
                <div class="field">
                  <label>Peso máx. (kg) *</label>
                  <input type="number" name="maxWeight" min="1" step="0.01" required [(ngModel)]="newVehicle.maxWeightKg" />
                </div>
                <div class="field">
                  <label>Volumen máx. (m³) *</label>
                  <input type="number" name="maxVol" min="0.1" step="0.001" required [(ngModel)]="newVehicle.maxVolumeM3" />
                </div>
              </div>
              <button type="submit" class="btn-primary">Guardar vehículo</button>
            </form>
          </article>
        }

        <article class="panel">
          <div class="panel-head">
            <h3>Flota registrada</h3>
            <span class="pill">{{ availableCount() }} disponibles</span>
          </div>
          <div class="cards-list">
            @for (v of vehicles(); track v.id ?? v.plate) {
              <div class="item-card">
                <div>
                  <strong>{{ v.plate }} · {{ v.name }}</strong>
                  <div class="meta">Capacidad: {{ v.maxWeightKg }} kg · {{ v.maxVolumeM3 }} m³</div>
                </div>
                <div class="actions">
                  @if (isAdmin() && v.id != null) {
                    <select [value]="v.status" (change)="changeVehicleStatus(v.id, $event)" class="mini-select">
                      <option value="DISPONIBLE">DISPONIBLE</option>
                      <option value="EN_RUTA">EN_RUTA</option>
                      <option value="MANTENIMIENTO">MANTENIMIENTO</option>
                    </select>
                    <button type="button" class="btn-danger" (click)="deleteVehicle(v.id)">Eliminar</button>
                  } @else {
                    <span class="pill">{{ v.status }}</span>
                  }
                </div>
              </div>
            } @empty {
              <p class="empty">No hay vehículos registrados.</p>
            }
          </div>
        </article>
      </section>
    }

    @if (activeTab() === 'TARIFFS') {
      <section class="grid-2">
        @if (isAdmin()) {
          <article class="panel">
            <h3>Nueva tarifa de trayecto</h3>
            <form (ngSubmit)="createTariff()" class="form-stack">
              <div class="row-2">
                <div class="field">
                  <label>Origen *</label>
                  <input type="text" name="origin" required [(ngModel)]="newTariff.origin" placeholder="Almacén Central" />
                </div>
                <div class="field">
                  <label>Destino *</label>
                  <input type="text" name="destination" required [(ngModel)]="newTariff.destination" placeholder="Lima Norte / Callao" />
                </div>
              </div>
              <div class="row-2">
                <div class="field">
                  <label>Costo ida y vuelta *</label>
                  <input type="number" name="cost" min="0" step="0.01" required [(ngModel)]="newTariff.roundTripCost" />
                </div>
                <div class="field">
                  <label>Horas estimadas</label>
                  <input type="number" name="hours" min="0.5" step="0.5" [(ngModel)]="newTariff.estimatedHours" />
                </div>
              </div>
              <button type="submit" class="btn-primary">Guardar tarifa</button>
            </form>
          </article>
        }

        <article class="panel">
          <h3>Tarifario vigente</h3>
          <div class="cards-list">
            @for (t of tariffs(); track t.id ?? t.destination) {
              <div class="item-card">
                <div>
                  <strong>{{ t.origin }} → {{ t.destination }}</strong>
                  <div class="meta">Ida y vuelta: {{ t.roundTripCost | number: '1.2-2' }} · {{ t.estimatedHours }} h</div>
                </div>
                @if (isAdmin() && t.id != null) {
                  <button type="button" class="btn-danger" (click)="deleteTariff(t.id)">Eliminar</button>
                }
              </div>
            } @empty {
              <p class="empty">No hay tarifas configuradas.</p>
            }
          </div>
        </article>
      </section>
    }

    @if (activeTab() === 'WMS') {
      <article class="panel">
        <div class="panel-head">
          <h3>Historial de Movimientos de Almacén (Kardex)</h3>
          <button type="button" class="btn-secondary" (click)="loadMovements()">Actualizar Kardex</button>
        </div>
        <div class="cards-list">
          @for (m of movements(); track m.id ?? $index) {
            <div class="item-card">
              <div>
                <span class="pill">{{ m.movementType }}</span>
                <strong style="margin-left: 0.45rem;">{{ m.quantity }} unidades</strong>
                <div class="meta">{{ m.reference || 'Movimiento operativo' }}</div>
              </div>
              <div class="meta">Stock resultante: <strong>{{ m.stockAfter }}</strong></div>
            </div>
          } @empty {
            <p class="empty">No hay movimientos registrados.</p>
          }
        </div>
      </article>
    }
  `,
  styles: [`
    .wh-header {
      display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center;
      gap: 1rem; margin-bottom: 1.25rem;
    }
    h2 { margin: 0; font-size: 1.4rem; color: #0f172a; }
    .subtitle { margin: 0.25rem 0 0; color: #64748b; font-size: 0.9rem; }
    .tabs { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .tab-btn {
      border: 1px solid #cbd5e1; background: #fff; color: #334155;
      border-radius: 9px; padding: 0.52rem 0.9rem; font-weight: 600; font-size: 0.85rem; cursor: pointer;
    }
    .tab-btn.active { background: #ea580c; color: #fff; border-color: #ea580c; }

    .grid-2 { display: grid; grid-template-columns: 1fr; gap: 1.25rem; align-items: start; }
    @media (min-width: 960px) { .grid-2 { grid-template-columns: 380px minmax(0, 1fr); } }

    .panel {
      background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.2rem;
    }
    .panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; }
    h3 { margin: 0 0 0.9rem; font-size: 1.02rem; color: #0f172a; }
    .panel-head h3 { margin: 0; }

    .form-stack { display: flex; flex-direction: column; gap: 0.8rem; }
    .row-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.65rem; }
    .field { display: flex; flex-direction: column; gap: 0.25rem; }
    label { font-size: 0.8rem; font-weight: 600; color: #334155; }
    input, select {
      width: 100%; box-sizing: border-box; padding: 0.52rem 0.65rem;
      border: 1px solid #cbd5e1; border-radius: 9px; font-size: 0.86rem;
    }
    .btn-primary {
      background: #ea580c; color: #fff; border: none; border-radius: 9px;
      padding: 0.6rem 1rem; font-weight: 600; cursor: pointer;
    }
    .btn-secondary {
      background: #fff; color: #1e293b; border: 1px solid #cbd5e1; border-radius: 8px;
      padding: 0.45rem 0.8rem; font-weight: 600; font-size: 0.82rem; cursor: pointer;
    }
    .btn-danger {
      background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;
      border-radius: 7px; padding: 0.3rem 0.6rem; font-size: 0.78rem; font-weight: 600; cursor: pointer;
    }
    .mini-select { width: auto; padding: 0.3rem 0.5rem; font-size: 0.78rem; }

    .cards-list { display: flex; flex-direction: column; gap: 0.65rem; }
    .item-card {
      display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center;
      gap: 0.6rem; padding: 0.75rem 0.9rem; border: 1px solid #e2e8f0; border-radius: 10px; background: #f8fafc;
    }
    .actions { display: flex; gap: 0.45rem; align-items: center; }
    .meta { font-size: 0.8rem; color: #64748b; margin-top: 0.15rem; }
    .pill {
      font-size: 0.74rem; font-weight: 700; padding: 0.18rem 0.55rem;
      border-radius: 999px; background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa;
    }
    .empty { margin: 0; color: #64748b; font-size: 0.88rem; }
    .alert { padding: 0.7rem 1rem; border-radius: 10px; margin-bottom: 1rem; font-size: 0.86rem; }
    .alert--error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
    .alert--success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
  `]
})
export class WarehousesPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = 'http://localhost:8080/api/warehouses';

  activeTab = signal<'FLEET' | 'TARIFFS' | 'WMS'>('FLEET');
  vehicles = signal<Vehicle[]>([]);
  tariffs = signal<RouteTariff[]>([]);
  movements = signal<InventoryMovement[]>([]);
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  isAdmin = computed(() => this.authService.currentRole() === 'ADMIN_ALMACEN');
  availableCount = computed(() => this.vehicles().filter((v) => v.status === 'DISPONIBLE').length);

  newVehicle: Vehicle = { plate: '', name: '', maxWeightKg: 1500, maxVolumeM3: 12, status: 'DISPONIBLE' };
  newTariff: RouteTariff = { origin: 'Almacén Central', destination: '', roundTripCost: 0, estimatedHours: 2 };

  ngOnInit(): void {
    this.loadVehicles();
    this.loadTariffs();
    this.loadMovements();
  }

  loadVehicles(): void {
    this.http.get<Vehicle[]>(`${this.apiUrl}/vehicles`).subscribe({
      next: (list) => this.vehicles.set(list ?? []),
      error: () => this.errorMsg.set('No se pudieron cargar los vehículos.')
    });
  }

  createVehicle(): void {
    this.errorMsg.set(null);
    this.http.post<Vehicle>(`${this.apiUrl}/vehicles`, this.newVehicle).subscribe({
      next: () => {
        this.successMsg.set('Vehículo registrado.');
        this.newVehicle = { plate: '', name: '', maxWeightKg: 1500, maxVolumeM3: 12, status: 'DISPONIBLE' };
        this.loadVehicles();
      },
      error: () => this.errorMsg.set('No se pudo registrar el vehículo.')
    });
  }

  changeVehicleStatus(id: number, event: Event): void {
    const status = (event.target as HTMLSelectElement).value;
    this.http.patch<Vehicle>(`${this.apiUrl}/vehicles/${id}/status`, { status }).subscribe({
      next: () => {
        this.successMsg.set('Estado de vehículo actualizado.');
        this.loadVehicles();
      },
      error: () => this.errorMsg.set('No se pudo actualizar el estado.')
    });
  }

  deleteVehicle(id: number): void {
    this.http.delete<void>(`${this.apiUrl}/vehicles/${id}`).subscribe({
      next: () => {
        this.successMsg.set('Vehículo eliminado.');
        this.loadVehicles();
      },
      error: () => this.errorMsg.set('No se pudo eliminar el vehículo.')
    });
  }

  loadTariffs(): void {
    this.http.get<RouteTariff[]>(`${this.apiUrl}/tariffs`).subscribe({
      next: (list) => this.tariffs.set(list ?? []),
      error: () => {}
    });
  }

  createTariff(): void {
    this.errorMsg.set(null);
    this.http.post<RouteTariff>(`${this.apiUrl}/tariffs`, this.newTariff).subscribe({
      next: () => {
        this.successMsg.set('Tarifa de trayecto registrada.');
        this.newTariff = { origin: 'Almacén Central', destination: '', roundTripCost: 0, estimatedHours: 2 };
        this.loadTariffs();
      },
      error: () => this.errorMsg.set('No se pudo guardar la tarifa.')
    });
  }

  deleteTariff(id: number): void {
    this.http.delete<void>(`${this.apiUrl}/tariffs/${id}`).subscribe({
      next: () => {
        this.successMsg.set('Tarifa eliminada.');
        this.loadTariffs();
      },
      error: () => this.errorMsg.set('No se pudo eliminar la tarifa.')
    });
  }

  loadMovements(): void {
    this.http.get<InventoryMovement[]>('http://localhost:8080/api/products/movements').subscribe({
      next: (list) => this.movements.set(list ?? []),
      error: () => {}
    });
  }
}