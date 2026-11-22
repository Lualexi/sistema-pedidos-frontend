import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink],
  template: `
    <section class="page-head">
      <div>
        <h2>Panel Operativo — Distribuciones C&amp;M</h2>
        <p class="subtitle">Control centralizado de inventario, almacenes, compras y pedidos.</p>
      </div>
      <div class="quick-actions">
        <a routerLink="/pedidos" class="btn-primary">Nuevo pedido</a>
        <a routerLink="/inventario" class="btn-secondary">Ver inventario</a>
      </div>
    </section>

    <section class="kpi-grid">
      <article class="kpi-card kpi-card--highlight">
        <span class="kpi-label">Flujo transaccional</span>
        <strong class="kpi-value">En vivo</strong>
        <span class="kpi-meta">Stock y pedidos sincronizados</span>
      </article>
      <article class="kpi-card">
        <span class="kpi-label">Módulo Pedidos (OMS)</span>
        <strong class="kpi-value">/pedidos</strong>
        <span class="kpi-meta">Órdenes, reservas y estados</span>
      </article>
      <article class="kpi-card">
        <span class="kpi-label">Inventario y Almacenes</span>
        <strong class="kpi-value">/inventario · /almacenes</strong>
        <span class="kpi-meta">Catálogo, stock y despachos</span>
      </article>
      <article class="kpi-card">
        <span class="kpi-label">Abastecimiento</span>
        <strong class="kpi-value">/compras</strong>
        <span class="kpi-meta">Reposición y proveedores</span>
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
    .kpi-label { font-size: 0.82rem; font-weight: 600; opacity: 0.85; }
    .kpi-value { font-size: 1.35rem; font-weight: 700; }
    .kpi-meta { font-size: 0.8rem; color: #64748b; }
  `]
})
export class DashboardPage {}