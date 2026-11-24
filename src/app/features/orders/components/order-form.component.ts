import { Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from '../../../shared/models/product.model';
import { Order, OrderItem } from '../../../shared/models/order.model';
import { RouteTariff, Vehicle } from '../../../shared/models/logistics.model';

interface DraftItem {
  productId: number | null;
  quantity: number;
}

@Component({
  selector: 'app-order-form',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="panel">
      <h3>Registrar pedido o cotización</h3>

      <form (ngSubmit)="submitOrder()" class="order-form">
        <div class="field-row">
          <div class="field">
            <label for="orderType">Tipo de registro</label>
            <select id="orderType" name="orderType" [(ngModel)]="orderType">
              <option value="ORDEN">ORDEN (Descuenta stock)</option>
              <option value="COTIZ">COTIZ (Cotización / Evaluación)</option>
            </select>
          </div>

          <div class="field">
            <label for="customerName">Cliente / Solicitante</label>
            <input
              id="customerName"
              name="customerName"
              type="text"
              [(ngModel)]="customerName"
              placeholder="Ej. Cliente Mayorista Norte"
            />
          </div>
        </div>

        <div class="field">
          <label for="tariffSelect">Destino / Ruta (Ida y vuelta)</label>
          <select
            id="tariffSelect"
            name="tariffSelect"
            [ngModel]="selectedTariffId()"
            (ngModelChange)="onTariffChange($event)"
          >
            <option [ngValue]="null">Sin ruta tarifada (o destino manual)</option>
            @for (t of tariffs(); track t.id ?? t.destination) {
              <option [ngValue]="t.id ?? null">
                {{ t.origin }} → {{ t.destination }} (Ida/Vuelta: {{ t.roundTripCost | number: '1.2-2' }})
              </option>
            }
          </select>
        </div>

        <div class="field">
          <label for="destinationInput">Destino de entrega</label>
          <input
            id="destinationInput"
            name="destinationInput"
            type="text"
            [(ngModel)]="destination"
            placeholder="Ej. Almacén Callao / Sucursal Sur"
          />
        </div>

        <div class="items-section">
          <div class="items-head">
            <span>Productos</span>
            <button type="button" class="btn-add" (click)="addItem()">+ Agregar ítem</button>
          </div>

          @for (row of items(); track $index) {
            <div class="item-row">
              <select
                class="item-select"
                [name]="'product_' + $index"
                [(ngModel)]="row.productId"
              >
                <option [ngValue]="null">Selecciona un producto...</option>
                @for (prod of products(); track prod.id ?? prod.name) {
                  <option [ngValue]="prod.id ?? null">
                    {{ prod.name }} (Stock: {{ prod.stock }} · {{ prod.price | number: '1.2-2' }})
                  </option>
                }
              </select>

              <input
                type="number"
                class="item-qty"
                min="1"
                [name]="'qty_' + $index"
                [(ngModel)]="row.quantity"
                placeholder="Cant."
              />

              @if (items().length > 1) {
                <button
                  type="button"
                  class="btn-remove"
                  (click)="removeItem($index)"
                  title="Quitar ítem"
                >
                  &times;
                </button>
              }
            </div>
          }
        </div>

        <!-- Validación de stock y carga/vehículos -->
        @if (stockIssues().length > 0) {
          <div class="warn-box">
            <strong>Stock insuficiente en almacén:</strong>
            <ul>
              @for (issue of stockIssues(); track issue) {
                <li>{{ issue }}</li>
              }
            </ul>
            <span>Tip: puedes cambiar el tipo a <strong>COTIZ</strong> para registrar la cotización sin bloquear por falta de stock.</span>
          </div>
        }

        <div class="logistics-box">
          <div class="log-line">
            <span>Peso / Volumen estimado:</span>
            <strong>{{ totalWeightKg() | number: '1.2-2' }} kg · {{ totalVolumeM3() | number: '1.3-3' }} m³</strong>
          </div>
          <div class="log-line">
            <span>Vehículos libres:</span>
            <strong>{{ availableVehicles().length }} disponibles</strong>
          </div>
          <div class="log-line">
            <span>Vehículos estimados necesarios:</span>
            <strong>{{ neededVehiclesCount() }}</strong>
          </div>
          <div class="log-line">
            <span>Costo viaje (ida y vuelta):</span>
            <strong>{{ shippingCost() | number: '1.2-2' }}</strong>
          </div>
        </div>

        <div class="summary-box">
          <span>Total estimado (productos + viaje):</span>
          <strong>{{ grandTotal() | number: '1.2-2' }}</strong>
        </div>

        <button type="submit" class="btn-primary" [disabled]="saving()">
          {{ saving() ? 'Procesando...' : (orderType === 'COTIZ' ? 'Registrar cotización (COTIZ)' : 'Confirmar y registrar pedido') }}
        </button>
      </form>
    </div>
  `,
  styles: [`
    .panel {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 1.25rem;
      min-width: 0;
    }
    h3 { margin: 0 0 1rem; font-size: 1.05rem; color: #0f172a; }
    .order-form { display: flex; flex-direction: column; gap: 0.85rem; }
    .field-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.65rem;
    }
    .field { display: flex; flex-direction: column; gap: 0.28rem; min-width: 0; }
    label { font-size: 0.82rem; font-weight: 600; color: #334155; }

    input[type="text"], input[type="number"], select {
      padding: 0.52rem 0.68rem;
      border: 1px solid #cbd5e1;
      border-radius: 9px;
      font-size: 0.86rem;
      background: #fff;
      min-width: 0;
    }
    input:focus, select:focus { outline: none; border-color: #ea580c; }

    .items-section { display: flex; flex-direction: column; gap: 0.55rem; }
    .items-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.84rem;
      font-weight: 600;
      color: #334155;
    }
    .btn-add {
      border: 1px solid #fed7aa;
      background: #fff7ed;
      color: #c2410c;
      border-radius: 8px;
      padding: 0.28rem 0.6rem;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
    }
    .item-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 74px auto;
      gap: 0.45rem;
      align-items: center;
    }
    .btn-remove {
      border: 1px solid #fecaca;
      background: #fef2f2;
      color: #b91c1c;
      border-radius: 8px;
      width: 32px;
      height: 34px;
      font-size: 1rem;
      cursor: pointer;
    }

    .warn-box {
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #92400e;
      border-radius: 10px;
      padding: 0.7rem 0.8rem;
      font-size: 0.8rem;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }
    .warn-box ul { margin: 0; padding-left: 1.1rem; }

    .logistics-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 0.7rem 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-size: 0.82rem;
      color: #334155;
    }
    .log-line { display: flex; justify-content: space-between; gap: 0.5rem; }

    .summary-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.7rem 0.85rem;
      background: #fff7ed;
      border: 1px solid #fed7aa;
      border-radius: 10px;
      font-size: 0.88rem;
      color: #7c2d12;
    }
    .summary-box strong { font-size: 1.05rem; color: #0f172a; }

    .btn-primary {
      background: #ea580c;
      color: #ffffff;
      border: none;
      border-radius: 9px;
      padding: 0.68rem 1rem;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
    }
    .btn-primary:hover:not(:disabled) { background: #c2410c; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class OrderFormComponent {
  products = input.required<Product[]>();
  vehicles = input<Vehicle[]>([]);
  tariffs = input<RouteTariff[]>([]);
  saving = input<boolean>(false);

  createOrder = output<Order>();

  orderType: 'ORDEN' | 'COTIZ' = 'ORDEN';
  customerName = '';
  destination = '';
  selectedTariffId = signal<number | null>(null);
  items = signal<DraftItem[]>([{ productId: null, quantity: 1 }]);

  availableVehicles = computed(() =>
    this.vehicles().filter((v) => (v.status || '').toUpperCase() === 'DISPONIBLE')
  );

  stockIssues = computed(() => {
    const catalog = this.products();
    const issues: string[] = [];
    for (const row of this.items()) {
      if (!row.productId || !row.quantity || row.quantity <= 0) continue;
      const prod = catalog.find((p) => p.id === row.productId);
      if (prod && prod.stock < row.quantity) {
        issues.push(`${prod.name}: solicita ${row.quantity}, disponible ${prod.stock}`);
      }
    }
    return issues;
  });

  totalWeightKg = computed(() => {
    const catalog = this.products();
    return this.items().reduce((sum, row) => {
      if (!row.productId || !row.quantity || row.quantity <= 0) return sum;
      const prod = catalog.find((p) => p.id === row.productId);
      return sum + (prod?.unitWeightKg ?? 0) * row.quantity;
    }, 0);
  });

  totalVolumeM3 = computed(() => {
    const catalog = this.products();
    return this.items().reduce((sum, row) => {
      if (!row.productId || !row.quantity || row.quantity <= 0) return sum;
      const prod = catalog.find((p) => p.id === row.productId);
      return sum + (prod?.unitVolumeM3 ?? 0) * row.quantity;
    }, 0);
  });

  neededVehiclesCount = computed(() => {
    const hasItems = this.items().some((r) => r.productId != null && r.quantity > 0);
    if (!hasItems) return 0;

    const avail = this.availableVehicles();
    if (avail.length === 0) return 1;

    const avgWeightCap = avail.reduce((acc, v) => acc + (v.maxWeightKg || 1000), 0) / avail.length;
    const avgVolCap = avail.reduce((acc, v) => acc + (v.maxVolumeM3 || 10), 0) / avail.length;

    const byWeight = avgWeightCap > 0 ? Math.ceil(this.totalWeightKg() / avgWeightCap) : 1;
    const byVol = avgVolCap > 0 ? Math.ceil(this.totalVolumeM3() / avgVolCap) : 1;

    return Math.max(1, byWeight, byVol);
  });

  shippingCost = computed(() => {
    const id = this.selectedTariffId();
    if (id == null) return 0;
    const tariff = this.tariffs().find((t) => t.id === id);
    return tariff ? Number(tariff.roundTripCost || 0) : 0;
  });

  itemsSubtotal = computed(() => {
    const catalog = this.products();
    return this.items().reduce((sum, row) => {
      if (!row.productId || !row.quantity || row.quantity <= 0) return sum;
      const found = catalog.find((p) => p.id === row.productId);
      return sum + (found ? found.price * row.quantity : 0);
    }, 0);
  });

  grandTotal = computed(() => this.itemsSubtotal() + this.shippingCost());

  onTariffChange(tariffId: number | null): void {
    this.selectedTariffId.set(tariffId);
    if (tariffId != null) {
      const tariff = this.tariffs().find((t) => t.id === tariffId);
      if (tariff && !this.destination.trim()) {
        this.destination = tariff.destination;
      }
    }
  }

  addItem(): void {
    this.items.update((list) => [...list, { productId: null, quantity: 1 }]);
  }

  removeItem(index: number): void {
    this.items.update((list) => list.filter((_, i) => i !== index));
  }

  submitOrder(): void {
    const validItems: OrderItem[] = this.items()
      .filter((row) => row.productId != null && row.quantity > 0)
      .map((row) => ({
        productId: Number(row.productId),
        quantity: Number(row.quantity)
      }));

    const payload: Order = {
      orderType: this.orderType,
      customerName: this.customerName.trim() || undefined,
      destination: this.destination.trim() || undefined,
      shippingCost: this.shippingCost(),
      items: validItems
    };

    this.createOrder.emit(payload);
  }

  resetAfterSuccess(): void {
    this.orderType = 'ORDEN';
    this.customerName = '';
    this.destination = '';
    this.selectedTariffId.set(null);
    this.items.set([{ productId: null, quantity: 1 }]);
  }
}