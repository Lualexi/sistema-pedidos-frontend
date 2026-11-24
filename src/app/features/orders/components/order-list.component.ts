import { Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Order } from '../../../shared/models/order.model';

@Component({
  selector: 'app-order-list',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="panel">
      <div class="list-head">
        <div>
          <h3>Seguimiento de órdenes y cotizaciones</h3>
          <span class="count-tag">{{ filteredOrders().length }} de {{ orders().length }} registros</span>
        </div>

        <div class="view-controls">
          <input
            type="text"
            class="search-input"
            [(ngModel)]="searchTerm"
            placeholder="Buscar #orden, cliente o destino..."
          />
          <button
            type="button"
            class="btn-mode"
            [class.btn-mode--active]="viewMode() === 'LIST'"
            (click)="viewMode.set('LIST')"
          >
            Lista
          </button>
          <button
            type="button"
            class="btn-mode"
            [class.btn-mode--active]="viewMode() === 'KANBAN'"
            (click)="viewMode.set('KANBAN')"
          >
            Kanban
          </button>
        </div>
      </div>

      @if (viewMode() === 'LIST') {
        <div class="orders-stack">
          @for (order of filteredOrders(); track order.id ?? $index) {
            <article class="order-card">
              <div class="order-top">
                <div>
                  <span class="order-id">#{{ order.id ?? '-' }}</span>
                  <span class="type-pill">{{ order.orderType || 'ORDEN' }}</span>
                  @if (order.customerName) {
                    <span class="order-customer">· {{ order.customerName }}</span>
                  }
                  @if (order.destination) {
                    <span class="order-dest">({{ order.destination }})</span>
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
                      <option value="COTIZACION">COTIZACION</option>
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
                <span class="order-date">
                  {{ order.date || 'Registro reciente' }}
                  @if (order.shippingCost && order.shippingCost > 0) {
                    · Viaje: {{ order.shippingCost | number: '1.2-2' }}
                  }
                </span>
                @if (order.total != null) {
                  <strong class="order-total">Total: {{ order.total | number: '1.2-2' }}</strong>
                }
              </div>
            </article>
          } @empty {
            <p class="empty-msg">No se encontraron pedidos con el filtro actual.</p>
          }
        </div>
      } @else {
        <div class="kanban-grid">
          @for (col of kanbanColumns; track col) {
            <div class="kanban-col">
              <div class="kanban-col-head">
                <span>{{ col }}</span>
                <span class="mini-count">{{ ordersByStatus(col).length }}</span>
              </div>
              <div class="kanban-cards">
                @for (order of ordersByStatus(col); track order.id ?? $index) {
                  <article class="kanban-card">
                    <div class="k-top">
                      <strong>#{{ order.id }} · {{ order.orderType || 'ORDEN' }}</strong>
                      @if (order.total != null) {
                        <span>{{ order.total | number: '1.2-2' }}</span>
                      }
                    </div>
                    <div class="k-sub">{{ order.customerName || 'Cliente general' }}</div>
                    @if (order.destination) {
                      <div class="k-dest">Destino: {{ order.destination }}</div>
                    }
                    @if (order.id != null) {
                      <select
                        class="status-select k-select"
                        [value]="order.status || col"
                        (change)="onStatusChange(order.id, $event)"
                      >
                        <option value="COTIZACION">COTIZACION</option>
                        <option value="PENDIENTE">PENDIENTE</option>
                        <option value="CONFIRMADO">CONFIRMADO</option>
                        <option value="DESPACHADO">DESPACHADO</option>
                        <option value="ENTREGADO">ENTREGADO</option>
                        <option value="CANCELADO">CANCELADO</option>
                      </select>
                    }
                  </article>
                }
              </div>
            </div>
          }
        </div>
      }
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
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    h3 { margin: 0 0.5rem 0 0; font-size: 1.05rem; color: #0f172a; display: inline; }
    .count-tag {
      font-size: 0.78rem;
      font-weight: 600;
      color: #475569;
      background: #f1f5f9;
      padding: 0.22rem 0.55rem;
      border-radius: 999px;
    }

    .view-controls { display: flex; flex-wrap: wrap; gap: 0.45rem; align-items: center; }
    .search-input {
      padding: 0.42rem 0.65rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.82rem;
      min-width: 190px;
    }
    .btn-mode {
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #334155;
      border-radius: 8px;
      padding: 0.42rem 0.7rem;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-mode--active {
      background: #ea580c;
      color: #fff;
      border-color: #ea580c;
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
    .type-pill {
      margin-left: 0.4rem;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.14rem 0.45rem;
      border-radius: 6px;
      background: #e2e8f0;
      color: #1e293b;
    }
    .order-customer { color: #475569; font-size: 0.88rem; margin-left: 0.35rem; }
    .order-dest { color: #64748b; font-size: 0.82rem; margin-left: 0.25rem; }

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

    .kanban-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(185px, 1fr));
      gap: 0.75rem;
      align-items: start;
    }
    .kanban-col {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 0.65rem;
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
    }
    .kanban-col-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
      font-weight: 700;
      color: #334155;
    }
    .mini-count {
      background: #fff;
      border: 1px solid #cbd5e1;
      border-radius: 999px;
      padding: 0.05rem 0.45rem;
      font-size: 0.7rem;
    }
    .kanban-cards { display: flex; flex-direction: column; gap: 0.5rem; }
    .kanban-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.6rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.8rem;
    }
    .k-top { display: flex; justify-content: space-between; gap: 0.25rem; }
    .k-sub { color: #334155; font-weight: 600; }
    .k-dest { color: #64748b; font-size: 0.74rem; }
    .k-select { margin-top: 0.25rem; width: 100%; }
  `]
})
export class OrderListComponent {
  orders = input.required<Order[]>();
  changeStatus = output<{ id: number; status: string }>();

  viewMode = signal<'LIST' | 'KANBAN'>('LIST');
  searchTerm = '';

  readonly kanbanColumns = ['COTIZACION', 'PENDIENTE', 'CONFIRMADO', 'DESPACHADO', 'ENTREGADO', 'CANCELADO'];

  filteredOrders = computed(() => {
    const q = this.searchTerm.trim().toLowerCase().replace(/^#/, '');
    const list = this.orders();
    if (!q) return list;

    return list.filter((o) => {
      const idMatch = String(o.id ?? '').toLowerCase().includes(q);
      const custMatch = (o.customerName || '').toLowerCase().includes(q);
      const destMatch = (o.destination || '').toLowerCase().includes(q);
      const typeMatch = (o.orderType || '').toLowerCase().includes(q);
      return idMatch || custMatch || destMatch || typeMatch;
    });
  });

  ordersByStatus(status: string): Order[] {
    return this.filteredOrders().filter((o) => {
      const st = (o.status || 'PENDIENTE').toUpperCase();
      return st === status;
    });
  }

  onStatusChange(id: number, event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.changeStatus.emit({ id, status: select.value });
  }
}