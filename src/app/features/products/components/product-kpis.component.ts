import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-kpis',
  imports: [CommonModule],
  template: `
    <section class="kpi-row">
      <article class="kpi-box">
        <span class="kpi-label">Productos registrados</span>
        <strong class="kpi-num">{{ totalProducts() }}</strong>
      </article>
      <article class="kpi-box kpi-box--warn">
        <span class="kpi-label">Stock crítico (&le; 10 und.)</span>
        <strong class="kpi-num">{{ lowStockCount() }}</strong>
      </article>
      <article class="kpi-box">
        <span class="kpi-label">Unidades totales en almacén</span>
        <strong class="kpi-num">{{ totalUnits() }}</strong>
      </article>
      <article class="kpi-box">
        <span class="kpi-label">Valorización de stock</span>
        <strong class="kpi-num">{{ totalValue() | number: '1.2-2' }}</strong>
      </article>
    </section>
  `,
  styles: [`
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
      min-width: 0;
    }
    .kpi-box--warn { border-color: #fed7aa; background: #fffbf7; }
    .kpi-label { font-size: 0.78rem; color: #64748b; font-weight: 600; }
    .kpi-num { font-size: 1.35rem; font-weight: 700; color: #0f172a; }
  `]
})
export class ProductKpisComponent {
  totalProducts = input.required<number>();
  lowStockCount = input.required<number>();
  totalUnits = input.required<number>();
  totalValue = input.required<number>();
}