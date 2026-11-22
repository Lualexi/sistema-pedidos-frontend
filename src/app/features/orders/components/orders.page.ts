import { Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order } from '../../../shared/models/order.model';
import { Product } from '../../../shared/models/product.model';
import { OrderService } from '../services/order.service';
import { ProductService } from '../../products/services/product.service';
import { OrderFormComponent } from './order-form.component';
import { OrderListComponent } from './order-list.component';

@Component({
  selector: 'app-orders-page',
  imports: [CommonModule, OrderFormComponent, OrderListComponent],
  template: `
    <section class="ord-header">
      <div>
        <h2>Gestión de Pedidos (OMS)</h2>
        <p class="subtitle">Registro de órdenes, impacto automático en stock y seguimiento de estados.</p>
      </div>
      <button type="button" class="btn-secondary" (click)="refreshAll()" [disabled]="loading()">
        {{ loading() ? 'Actualizando...' : 'Actualizar' }}
      </button>
    </section>

    <section class="kpi-row">
      <article class="kpi-box">
        <span class="kpi-label">Total de pedidos</span>
        <strong class="kpi-num">{{ orders().length }}</strong>
      </article>
      <article class="kpi-box">
        <span class="kpi-label">Pendientes / en proceso</span>
        <strong class="kpi-num">{{ activeOrdersCount() }}</strong>
      </article>
      <article class="kpi-box">
        <span class="kpi-label">Monto acumulado</span>
        <strong class="kpi-num">{{ totalAmount() | number: '1.2-2' }}</strong>
      </article>
    </section>

    @if (errorMsg()) {
      <div class="alert alert--error">{{ errorMsg() }}</div>
    }

    @if (successMsg()) {
      <div class="alert alert--success">{{ successMsg() }}</div>
    }

    <section class="ord-layout">
      <app-order-form
        [products]="products()"
        [saving]="saving()"
        (createOrder)="onCreateOrder($event)"
      />

      <app-order-list
        [orders]="orders()"
        (changeStatus)="onChangeStatus($event)"
      />
    </section>
  `,
  styles: [`
    .ord-header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    h2 { margin: 0; font-size: 1.4rem; color: #0f172a; }
    .subtitle { margin: 0.25rem 0 0; color: #64748b; font-size: 0.9rem; }

    .btn-secondary {
      background: #fff; color: #1e293b; border: 1px solid #cbd5e1; border-radius: 9px;
      padding: 0.58rem 0.9rem; font-weight: 600; font-size: 0.88rem; cursor: pointer;
    }
    .btn-secondary:hover { background: #f8fafc; }

    .kpi-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.9rem;
      margin-bottom: 1.25rem;
    }
    .kpi-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0.95rem 1.1rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .kpi-label { font-size: 0.78rem; color: #64748b; font-weight: 600; }
    .kpi-num { font-size: 1.35rem; font-weight: 700; color: #0f172a; }

    .ord-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.25rem;
      align-items: start;
    }
    @media (min-width: 960px) {
      .ord-layout { grid-template-columns: 390px minmax(0, 1fr); }
    }

    .alert { padding: 0.75rem 1rem; border-radius: 10px; margin-bottom: 1rem; font-size: 0.88rem; font-weight: 500; }
    .alert--error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
    .alert--success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
  `]
})
export class OrdersPage implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly productService = inject(ProductService);
  private readonly formComp = viewChild(OrderFormComponent);

  orders = signal<Order[]>([]);
  products = signal<Product[]>([]);
  loading = signal(false);
  saving = signal(false);
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  activeOrdersCount = computed(() =>
    this.orders().filter((o) => (o.status ?? 'PENDIENTE') !== 'CANCELADO' && o.status !== 'ENTREGADO').length
  );

  totalAmount = computed(() =>
    this.orders().reduce((sum, o) => sum + (o.total ?? 0), 0)
  );

  ngOnInit(): void {
    this.refreshAll();
  }

  refreshAll(): void {
    this.loading.set(true);
    this.errorMsg.set(null);

    this.productService.getAll().subscribe({
      next: (prods) => this.products.set(prods ?? []),
      error: () => {}
    });

    this.orderService.getAll().subscribe({
      next: (data) => {
        this.orders.set(data ?? []);
        this.loading.set(false);
      },
      error: (err: { status?: number }) => {
        this.loading.set(false);
        if (err.status === 401 || err.status === 403) {
          this.errorMsg.set('Inicia sesión para consultar y registrar pedidos.');
        } else {
          this.errorMsg.set('No se pudieron cargar los pedidos desde el backend.');
        }
      }
    });
  }

  onCreateOrder(payload: Order): void {
    this.errorMsg.set(null);
    this.successMsg.set(null);

    if (!payload.items || payload.items.length === 0) {
      this.errorMsg.set('Selecciona al menos un producto con cantidad mayor a 0.');
      return;
    }

    this.saving.set(true);
    this.orderService.create(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.successMsg.set('Pedido registrado y stock actualizado en almacén.');
        this.formComp()?.resetAfterSuccess();
        this.refreshAll();
      },
      error: (err: { status?: number }) => {
        this.saving.set(false);
        if (err.status === 400) {
          this.errorMsg.set('Verifica los datos del pedido o si hay stock suficiente.');
        } else if (err.status === 401 || err.status === 403) {
          this.errorMsg.set('No tienes permisos para registrar pedidos.');
        } else {
          this.errorMsg.set('Error al registrar el pedido en el servidor.');
        }
      }
    });
  }

  onChangeStatus(event: { id: number; status: string }): void {
    this.errorMsg.set(null);
    this.successMsg.set(null);

    this.orderService.updateStatus(event.id, event.status).subscribe({
      next: () => {
        this.successMsg.set(`Estado del pedido #${event.id} actualizado a ${event.status}.`);
        this.refreshAll();
      },
      error: () => {
        this.errorMsg.set('No se pudo actualizar el estado del pedido.');
      }
    });
  }
}