import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Product } from '../../../shared/models/product.model';
import { Order } from '../../../shared/models/order.model';
import { PurchaseOrder, Vehicle } from '../../../shared/models/logistics.model';
import { PermissionService } from '../../../core/services/permission.service';

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink],
  template: `
    <section class="page-head">
      <div>
        <h2>Panel Operativo — Distribuciones C&amp;M</h2>
        <p class="subtitle">Indicadores en tiempo real y accesos rápidos según tus permisos asignados.</p>
      </div>
      <div class="quick-actions">
        @if (permissionService.canView('PEDIDOS')) {
          <a routerLink="/pedidos" class="btn-primary">Nuevo pedido</a>
        }
        @if (permissionService.canView('INVENTARIO')) {
          <a routerLink="/inventario" class="btn-secondary">Ver inventario</a>
        }
        @if (permissionService.canView('ALMACENES')) {
          <a routerLink="/almacenes" class="btn-secondary">Flota y almacén</a>
        }
        @if (permissionService.canView('COMPRAS')) {
          <a routerLink="/compras" class="btn-secondary">Compras</a>
        }
      </div>
    </section>

    <section class="kpi-grid">
      <article class="kpi-card kpi-card--highlight">
        <span class="kpi-label">Pedidos pendientes</span>
        <strong class="kpi-value">{{ pendingOrdersCount() }}</strong>
        <span class="kpi-meta">De {{ orders().length }} órdenes/cotizaciones registradas</span>
      </article>

      <article class="kpi-card" [class.kpi-card--alert]="lowStockProducts().length > 0">
        <span class="kpi-label">Productos con stock bajo</span>
        <strong class="kpi-value">{{ lowStockProducts().length }}</strong>
        <span class="kpi-meta">Por debajo o igual al stock mínimo</span>
      </article>

      <article class="kpi-card">
        <span class="kpi-label">Flota disponible</span>
        <strong class="kpi-value">{{ availableVehiclesCount() }} / {{ vehicles().length }}</strong>
        <span class="kpi-meta">Unidades listas para despacho</span>
      </article>

      <article class="kpi-card">
        <span class="kpi-label">Compras pendientes</span>
        <strong class="kpi-value">{{ pendingPurchasesCount() }}</strong>
        <span class="kpi-meta">Órdenes por recepcionar en almacén</span>
      </article>
    </section>

    <section class="summary-grid">
      <article class="panel">
        <div class="panel-head">
          <h3>Alertas de Stock Crítico</h3>
          @if (permissionService.canView('INVENTARIO')) {
            <a routerLink="/inventario" class="link-action">Ir a inventario →</a>
          }
        </div>
        @if (lowStockProducts().length === 0) {
          <p class="empty-msg">No hay productos en nivel crítico actualmente.</p>
        } @else {
          <ul class="alert-list">
            @for (item of lowStockProducts().slice(0, 5); track item.id) {
              <li>
                <div>
                  <strong>{{ item.name }}</strong>
                  <span class="muted"> · Mínimo: {{ item.minStock ?? 10 }}</span>
                </div>
                <span class="badge-danger">Stock: {{ item.stock }}</span>
              </li>
            }
          </ul>
        }
      </article>

      <article class="panel">
        <div class="panel-head">
          <h3>Últimos Pedidos</h3>
          @if (permissionService.canView('PEDIDOS')) {
            <a routerLink="/pedidos" class="link-action">Ver todos →</a>
          }
        </div>
        @if (orders().length === 0) {
          <p class="empty-msg">Aún no hay pedidos registrados.</p>
        } @else {
          <ul class="alert-list">
            @for (ord of orders().slice(0, 5); track ord.id) {
              <li>
                <div>
                  <strong>#{{ ord.id }} · {{ ord.customerName || 'Cliente general' }}</strong>
                  <span class="muted"> · {{ ord.orderType || 'ORDEN' }}</span>
                </div>
                <span class="badge-status">{{ ord.status }}</span>
              </li>
            }
          </ul>
        }
      </article>
    </section>
  `,
  styles: [`
    .page-head {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    h2 { margin: 0; font-size: 1.45rem; color: #0f172a; }
    .subtitle { margin: 0.25rem 0 0; color: #64748b; font-size: 0.92rem; }
    .quick-actions { display: flex; gap: 0.65rem; flex-wrap: wrap; }
    .btn-primary, .btn-secondary {
      text-decoration: none;
      padding: 0.55rem 1rem;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .btn-primary { background: #ea580c; color: #fff; }
    .btn-primary:hover { background: #c2410c; }
    .btn-secondary { background: #fff; color: #1e293b; border: 1px solid #cbd5e1; }
    .btn-secondary:hover { background: #f8fafc; }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    .kpi-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 1.15rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .kpi-card--highlight {
      background: linear-gradient(135deg, #ea580c 0%, #f97316 100%);
      color: #ffffff;
      border: none;
    }
    .kpi-card--highlight .kpi-meta { color: #ffedd5; }
    .kpi-card--alert { border-color: #fecaca; background: #fffafa; }
    .kpi-label { font-size: 0.82rem; font-weight: 600; opacity: 0.88; }
    .kpi-value { font-size: 1.55rem; font-weight: 800; }
    .kpi-meta { font-size: 0.8rem; color: #64748b; }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
    }
    .panel {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 1.15rem;
    }
    .panel-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.85rem;
    }
    h3 { margin: 0; font-size: 1rem; color: #0f172a; }
    .link-action { font-size: 0.83rem; font-weight: 600; color: #ea580c; text-decoration: none; }
    .empty-msg { margin: 0; font-size: 0.88rem; color: #64748b; }
    .alert-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    .alert-list li {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
      padding: 0.55rem 0.7rem;
      border-radius: 9px;
      background: #f8fafc;
      font-size: 0.87rem;
    }
    .muted { color: #64748b; font-size: 0.8rem; }
    .badge-danger {
      background: #fee2e2;
      color: #b91c1c;
      font-weight: 700;
      font-size: 0.78rem;
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
    }
    .badge-status {
      background: #e2e8f0;
      color: #1e293b;
      font-weight: 700;
      font-size: 0.76rem;
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
    }
  `]
})
export class DashboardPage implements OnInit {
  private readonly http = inject(HttpClient);
  readonly permissionService = inject(PermissionService);

  products = signal<Product[]>([]);
  orders = signal<Order[]>([]);
  vehicles = signal<Vehicle[]>([]);
  purchases = signal<PurchaseOrder[]>([]);

  pendingOrdersCount = computed(() =>
    this.orders().filter((o) => (o.status || '').toUpperCase() === 'PENDIENTE').length
  );

  lowStockProducts = computed(() =>
    this.products().filter((p) => (p.stock ?? 0) <= (p.minStock ?? 10))
  );

  availableVehiclesCount = computed(() =>
    this.vehicles().filter((v) => (v.status || '').toUpperCase() === 'DISPONIBLE').length
  );

  pendingPurchasesCount = computed(() =>
    this.purchases().filter((po) => (po.status || '').toUpperCase() === 'PENDIENTE').length
  );

  ngOnInit(): void {
    this.http.get<Product[]>('http://localhost:8080/api/products').subscribe({
      next: (data) => this.products.set(data ?? []),
      error: () => this.products.set([])
    });

    this.http.get<Order[]>('http://localhost:8080/api/orders').subscribe({
      next: (data) => this.orders.set(data ?? []),
      error: () => this.orders.set([])
    });

    this.http.get<Vehicle[]>('http://localhost:8080/api/warehouses/vehicles').subscribe({
      next: (data) => this.vehicles.set(data ?? []),
      error: () => this.vehicles.set([])
    });

    this.http.get<PurchaseOrder[]>('http://localhost:8080/api/purchases/orders').subscribe({
      next: (data) => this.purchases.set(data ?? []),
      error: () => this.purchases.set([])
    });
  }
}