import { Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from '../../../shared/models/product.model';
import { Order, OrderItem } from '../../../shared/models/order.model';

interface DraftItem {
  productId: number | null;
  quantity: number;
}

@Component({
  selector: 'app-order-form',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="panel">
      <h3>Registrar nuevo pedido</h3>

      <form (ngSubmit)="submitOrder()" class="order-form">
        <div class="field">
          <label for="customerName">Cliente / Área solicitante</label>
          <input
            id="customerName"
            name="customerName"
            type="text"
            [(ngModel)]="customerName"
            placeholder="Ej. Cliente Mayorista Norte"
          />
        </div>

        <div class="items-section">
          <div class="items-head">
            <span>Productos del pedido</span>
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
                  <option [ngValue]="prod.id ?? null" [disabled]="prod.stock <= 0">
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

        <div class="summary-box">
          <span>Subtotal estimado:</span>
          <strong>{{ estimatedTotal() | number: '1.2-2' }}</strong>
        </div>

        <button type="submit" class="btn-primary" [disabled]="saving()">
          {{ saving() ? 'Procesando pedido...' : 'Confirmar y registrar pedido' }}
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
    .order-form { display: flex; flex-direction: column; gap: 0.95rem; }
    .field { display: flex; flex-direction: column; gap: 0.3rem; min-width: 0; }
    label { font-size: 0.84rem; font-weight: 600; color: #334155; }

    input[type="text"], input[type="number"], select {
      padding: 0.55rem 0.7rem;
      border: 1px solid #cbd5e1;
      border-radius: 9px;
      font-size: 0.88rem;
      background: #fff;
      min-width: 0;
    }
    input:focus, select:focus { outline: none; border-color: #ea580c; }

    .items-section { display: flex; flex-direction: column; gap: 0.6rem; }
    .items-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.85rem;
      font-weight: 600;
      color: #334155;
    }
    .btn-add {
      border: 1px solid #fed7aa;
      background: #fff7ed;
      color: #c2410c;
      border-radius: 8px;
      padding: 0.3rem 0.65rem;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-add:hover { background: #ffedd5; }

    .item-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 78px auto;
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

    .summary-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.7rem 0.85rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.9rem;
    }
    .summary-box strong { font-size: 1.05rem; color: #0f172a; }

    .btn-primary {
      background: #ea580c;
      color: #ffffff;
      border: none;
      border-radius: 9px;
      padding: 0.68rem 1rem;
      font-weight: 600;
      font-size: 0.92rem;
      cursor: pointer;
    }
    .btn-primary:hover:not(:disabled) { background: #c2410c; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class OrderFormComponent {
  products = input.required<Product[]>();
  saving = input<boolean>(false);

  createOrder = output<Order>();

  customerName = '';
  items = signal<DraftItem[]>([{ productId: null, quantity: 1 }]);

  estimatedTotal = computed(() => {
    const catalog = this.products();
    return this.items().reduce((sum, row) => {
      if (!row.productId || !row.quantity || row.quantity <= 0) return sum;
      const found = catalog.find((p) => p.id === row.productId);
      return sum + (found ? found.price * row.quantity : 0);
    }, 0);
  });

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
      customerName: this.customerName.trim() || undefined,
      items: validItems
    };

    this.createOrder.emit(payload);
  }

  resetAfterSuccess(): void {
    this.customerName = '';
    this.items.set([{ productId: null, quantity: 1 }]);
  }
}