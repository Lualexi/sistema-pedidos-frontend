import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order } from '../../../shared/models/order.model';

@Component({
  selector: 'app-order-list',
  imports: [CommonModule],
  template: `
    <div class="panel">
      <div class="list-head">
        <h3>Órdenes registradas</h3>
        <span class="count-tag">{{ orders().length }} pedidos</span>
      </div>

      <div class="orders-stack">
        @for (order of orders(); track order.id ?? $index) {
          <article class="order-card">
            <div class="order-top">
              <div>
                <span class="order-id">Pedido #{{ order.id ?? '-' }}</span>
                @if (order.customerName) {
                  <span class="order-customer">· {{ order.customerName }}</span>
                }
              </div>

              <div class="order-controls">
                <span class="status-badge">{{ order.status || 'PENDIENTE' }}</span>
                @if (order.id != null) {
                  <select
                    class="status-select"
                    [value]="order.status || 'PENDIENTE'"
                    (change)="onStatusChange(order.id, $event)"
                  >
                    <option value="PENDIENTE">PENDIENTE</option>
                    <option value="CONFIRMADO">CONFIRMADO</option>
                    <option value="DESPACHADO">DESPACHADO</option>
                    <option value="ENTREGADO">ENTREGADO</option>
                    <option value="CANCELADO">CANCELADO</option>
                  </select>
                }
              </div>
            </div>

            @if (order.items && order.items.length > 0) {
              <ul class="item-list">
                @for (it of order.items; track it.id ?? $index) {
                  <li>
                    <span>{{ it.productName || ('Producto #' + it.productId) }}</span>
                    <span>x{{ it.quantity }}</span>
                  </li>
                }
              </ul>
            }

            <div class="order-foot">
              <span class="order-date">{{ order.createdAt || 'Registro reciente' }}</span>
              @if (order.total != null) {
                <strong class="order-total">Total: {{ order.total | number: '1.2-2' }}</strong>
              }
            </div>
          </article>
        } @empty {
          <p class="empty-msg">Aún no hay pedidos registrados en el sistema.</p>
        }
      </div>
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
    .list-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    h3 { margin: 0; font-size: 1.05rem; color: #0f172a; }
    .count-tag {
      font-size: 0.78rem;
      font-weight: 600;
      color: #475569;
      background: #f1f5f9;
      padding: 0.25rem 0.6rem;
      border-radius: 999px;
    }

    .orders-stack { display: flex; flex-direction: column; gap: 0.85rem; }
    .order-card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0.95rem 1rem;
      background: #fcfcfd;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }
    .order-top {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
    }
    .order-id { font-weight: 700; color: #0f172a; font-size: 0.95rem; }
    .order-customer { color: #475569; font-size: 0.88rem; }

    .order-controls { display: flex; align-items: center; gap: 0.45rem; }
    .status-badge {
      font-size: 0.74rem;
      font-weight: 700;
      padding: 0.22rem 0.6rem;
      border-radius: 999px;
      background: #fff7ed;
      color: #c2410c;
      border: 1px solid #fed7aa;
    }
    .status-select {
      padding: 0.3rem 0.5rem;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      font-size: 0.8rem;
      background: #fff;
    }

    .item-list {
      list-style: none;
      margin: 0;
      padding: 0.5rem 0.7rem;
      background: #ffffff;
      border: 1px solid #f1f5f9;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      font-size: 0.84rem;
      color: #334155;
    }
    .item-list li { display: flex; justify-content: space-between; }

    .order-foot {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.84rem;
      color: #64748b;
    }
    .order-total { color: #0f172a; font-size: 0.95rem; }
    .empty-msg { color: #64748b; text-align: center; padding: 1.5rem 0; margin: 0; }
  `]
})
export class OrderListComponent {
  orders = input.required<Order[]>();
  changeStatus = output<{ id: number; status: string }>();

  onStatusChange(id: number, event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.changeStatus.emit({ id, status: select.value });
  }
}