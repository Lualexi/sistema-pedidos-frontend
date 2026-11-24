import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { InventoryMovement, Product } from '../../../shared/models/product.model';
import { ProductService } from '../services/product.service';
import { AuthService } from '../../auth/services/auth.service';
import { ProductKpisComponent } from './product-kpis.component';
import { ProductFormComponent } from './product-form.component';
import { ProductTableComponent } from './product-table.component';

@Component({
  selector: 'app-inventory-page',
  imports: [ProductKpisComponent, ProductFormComponent, ProductTableComponent],
  template: `
    <section class="inv-header">
      <div>
        <h2>Inventario y Catálogo de Productos</h2>
        <p class="subtitle">Control de existencias, Kardex y alertas de stock para Distribuciones C&amp;M.</p>
      </div>
      <div class="header-actions">
        <span class="role-pill">Rol: {{ authService.currentRole() || 'SIN SESIÓN' }}</span>
        <button type="button" class="btn-secondary" (click)="loadProducts()" [disabled]="loading()">
          {{ loading() ? 'Actualizando...' : 'Actualizar' }}
        </button>
        @if (canManageProducts() && !formOpen()) {
          <button type="button" class="btn-primary" (click)="openNewForm()">
            + Nuevo
          </button>
        }
      </div>
    </section>

    <app-product-kpis
      [totalProducts]="products().length"
      [lowStockCount]="lowStockCount()"
      [totalUnits]="totalUnits()"
      [totalValue]="totalValue()"
    />

    @if (errorMsg()) {
      <div class="alert alert--error">{{ errorMsg() }}</div>
    }

    @if (successMsg()) {
      <div class="alert alert--success">{{ successMsg() }}</div>
    }

    <section class="inv-layout" [class.inv-layout--form-open]="formOpen()">
      <!-- Centro: Tabla de productos (sin estirarse indefinidamente) -->
      <div class="center-col">
        <app-product-table
          [products]="visibleProducts()"
          [canManage]="canManageProducts()"
          (editProduct)="startEdit($event)"
          (deleteProduct)="onDelete($event)"
          (searchDb)="onSearchDb($event)"
        />
      </div>

      <!-- Lateral derecho: Si formOpen() es true, muestra el formulario y oculta acciones rápidas -->
      <aside class="side-col">
        @if (formOpen()) {
          <app-product-form
            [canManage]="canManageProducts()"
            [saving]="saving()"
            [editingProduct]="editingProduct()"
            (saveProduct)="onSaveProduct($event)"
            (cancelEdit)="closeForm()"
          />
        } @else {
          <div class="quick-panel">
            <h3>Acciones rápidas</h3>
            <p class="panel-desc">Herramientas operativas de inventario y reportes.</p>

            <div class="quick-buttons">
              <button
                type="button"
                class="action-btn"
                [class.action-btn--active]="onlyLowStock()"
                (click)="onlyLowStock.update(v => !v)"
              >
                <span>⚠️ {{ onlyLowStock() ? 'Mostrar todos' : 'Filtrar stock bajo' }}</span>
                <span class="pill">{{ lowStockCount() }}</span>
              </button>

              <button type="button" class="action-btn" (click)="toggleKardex()">
                <span>📒 {{ showKardex() ? 'Ocultar Kardex' : 'Ver Kardex (Entradas/Salidas)' }}</span>
              </button>

              <button type="button" class="action-btn" (click)="exportCsv()">
                <span>📥 Exportar reporte CSV</span>
              </button>
            </div>

            @if (showKardex()) {
              <div class="kardex-box">
                <div class="kardex-head">
                  <strong>Últimos movimientos</strong>
                  <button type="button" class="btn-mini" (click)="loadMovements()">↻</button>
                </div>
                @if (movements().length === 0) {
                  <p class="empty-kardex">Sin movimientos registrados aún.</p>
                } @else {
                  <ul class="kardex-list">
                    @for (mov of movements().slice(0, 8); track mov.id) {
                      <li>
                        <div class="mov-top">
                          <span class="mov-type" [attr.data-type]="mov.movementType">{{ mov.movementType }}</span>
                          <strong>{{ mov.quantity }} und.</strong>
                        </div>
                        <div class="mov-meta">
                          {{ mov.reference || 'Movimiento inventario' }} · Saldo: {{ mov.stockAfter }}
                        </div>
                      </li>
                    }
                  </ul>
                }
              </div>
            }
          </div>
        }
      </aside>
    </section>
  `,
  styles: [`
    .inv-header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    h2 { margin: 0; font-size: 1.4rem; color: #0f172a; }
    .subtitle { margin: 0.25rem 0 0; color: #64748b; font-size: 0.9rem; }
    .header-actions { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }

    .role-pill {
      font-size: 0.78rem;
      font-weight: 700;
      background: #fff7ed;
      color: #c2410c;
      border: 1px solid #fed7aa;
      padding: 0.35rem 0.7rem;
      border-radius: 999px;
    }

    .btn-primary {
      background: #ea580c; color: #fff; border: none; border-radius: 9px;
      padding: 0.58rem 1rem; font-weight: 700; font-size: 0.88rem; cursor: pointer;
    }
    .btn-primary:hover { background: #c2410c; }

    .btn-secondary {
      background: #fff; color: #1e293b; border: 1px solid #cbd5e1; border-radius: 9px;
      padding: 0.58rem 0.9rem; font-weight: 600; font-size: 0.88rem; cursor: pointer;
    }
    .btn-secondary:hover { background: #f8fafc; }

    .inv-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.25rem;
      align-items: start;
    }
    @media (min-width: 1024px) {
      .inv-layout {
        grid-template-columns: minmax(0, 1fr) 310px;
      }
      .inv-layout--form-open {
        grid-template-columns: minmax(0, 1fr) 390px;
      }
      .side-col {
        position: sticky;
        top: 5.5rem;
      }
    }
    .center-col, .side-col { min-width: 0; }

    .quick-panel {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 1.15rem;
    }
    .quick-panel h3 { margin: 0; font-size: 1.02rem; color: #0f172a; }
    .panel-desc { margin: 0.25rem 0 0.95rem; font-size: 0.82rem; color: #64748b; }

    .quick-buttons {
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
    }
    .action-btn {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 0.65rem 0.8rem;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      color: #1e293b;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      text-align: left;
    }
    .action-btn:hover { background: #f1f5f9; }
    .action-btn--active {
      background: #fff7ed;
      border-color: #fdba74;
      color: #c2410c;
    }
    .pill {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 999px;
      padding: 0.1rem 0.5rem;
      font-size: 0.76rem;
    }

    .kardex-box {
      margin-top: 1rem;
      padding-top: 0.9rem;
      border-top: 1px solid #e2e8f0;
    }
    .kardex-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.6rem;
      font-size: 0.85rem;
    }
    .btn-mini {
      border: 1px solid #cbd5e1;
      background: #fff;
      border-radius: 6px;
      padding: 0.15rem 0.45rem;
      cursor: pointer;
    }
    .empty-kardex { font-size: 0.82rem; color: #64748b; margin: 0; }
    .kardex-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 290px;
      overflow-y: auto;
    }
    .kardex-list li {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.5rem 0.65rem;
      font-size: 0.8rem;
    }
    .mov-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.2rem;
    }
    .mov-type {
      font-weight: 700;
      font-size: 0.72rem;
      padding: 0.1rem 0.42rem;
      border-radius: 6px;
      background: #e2e8f0;
      color: #0f172a;
    }
    .mov-type[data-type="ENTRADA"], .mov-type[data-type="REINTEGRO"] {
      background: #dcfce7;
      color: #15803d;
    }
    .mov-type[data-type="SALIDA"] {
      background: #fee2e2;
      color: #b91c1c;
    }
    .mov-meta { color: #64748b; font-size: 0.75rem; }

    .alert { padding: 0.75rem 1rem; border-radius: 10px; margin-bottom: 1rem; font-size: 0.88rem; font-weight: 500; }
    .alert--error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
    .alert--success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
  `]
})
export class InventoryPage implements OnInit {
  private readonly productService = inject(ProductService);
  readonly authService = inject(AuthService);

  products = signal<Product[]>([]);
  movements = signal<InventoryMovement[]>([]);
  loading = signal(false);
  saving = signal(false);
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  formOpen = signal(false);
  editingProduct = signal<Product | null>(null);
  onlyLowStock = signal(false);
  showKardex = signal(false);
  lastSearch = signal('');

  canManageProducts = computed(() => this.authService.currentRole() === 'ADMIN_ALMACEN');

  lowStockCount = computed(() =>
    this.products().filter((p) => (p.stock ?? 0) <= (p.minStock ?? 10)).length
  );

  visibleProducts = computed(() => {
    const list = this.products();
    if (!this.onlyLowStock()) {
      return list;
    }
    return list.filter((p) => (p.stock ?? 0) <= (p.minStock ?? 10));
  });

  totalUnits = computed(() => this.products().reduce((acc, p) => acc + (p.stock || 0), 0));
  totalValue = computed(() => this.products().reduce((acc, p) => acc + (p.price || 0) * (p.stock || 0), 0));

  ngOnInit(): void {
    this.loadProducts();
  }

  openNewForm(): void {
    this.editingProduct.set(null);
    this.formOpen.set(true);
    this.errorMsg.set(null);
    this.successMsg.set(null);
  }

  closeForm(): void {
    this.editingProduct.set(null);
    this.formOpen.set(false);
  }

  onSearchDb(query: string): void {
    this.lastSearch.set(query);
    this.loadProducts(query);
  }

  loadProducts(search?: string): void {
    this.loading.set(true);
    this.errorMsg.set(null);
    const query = search ?? this.lastSearch();

    this.productService.getAll(query).subscribe({
      next: (data) => {
        this.products.set(data ?? []);
        this.loading.set(false);
      },
      error: (err: { status?: number }) => {
        this.loading.set(false);
        if (err.status === 401 || err.status === 403) {
          this.errorMsg.set('Debes iniciar sesión con un usuario autorizado para consultar el inventario.');
        } else {
          this.errorMsg.set('No se pudo cargar el inventario desde el backend.');
        }
      }
    });
  }

  toggleKardex(): void {
    const next = !this.showKardex();
    this.showKardex.set(next);
    if (next) {
      this.loadMovements();
    }
  }

  loadMovements(): void {
    this.productService.getMovements().subscribe({
      next: (list) => this.movements.set(list ?? []),
      error: () => this.movements.set([])
    });
  }

  exportCsv(): void {
    const rows = this.visibleProducts();
    const header = ['ID', 'Nombre', 'Categoria', 'Moneda', 'Precio', 'Stock', 'StockMinimo'];
    const lines = rows.map((p) => [
      p.id ?? '',
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.category || 'General').replace(/"/g, '""')}"`,
      p.currency || 'PEN',
      p.price ?? 0,
      p.stock ?? 0,
      p.minStock ?? 10
    ].join(','));

    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'inventario_distribuciones_cm.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  onSaveProduct(payload: Product): void {
    this.errorMsg.set(null);
    this.successMsg.set(null);

    if (!payload.name || payload.price < 0 || payload.stock < 0) {
      this.errorMsg.set('Completa el nombre del producto y valores válidos (precio y stock ≥ 0).');
      return;
    }

    this.saving.set(true);
    const id = payload.id ?? this.editingProduct()?.id;

    const request$ = id != null
      ? this.productService.update(id, payload)
      : this.productService.create(payload);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.successMsg.set(id != null ? 'Producto actualizado correctamente.' : 'Producto registrado en el inventario.');
        this.closeForm();
        this.loadProducts();
        if (this.showKardex()) {
          this.loadMovements();
        }
      },
      error: (err: { status?: number }) => {
        this.saving.set(false);
        if (err.status === 403) {
          this.errorMsg.set('Acceso denegado (403): solo ADMIN_ALMACEN puede modificar productos.');
        } else {
          this.errorMsg.set('Error al guardar el producto en el servidor.');
        }
      }
    });
  }

  startEdit(product: Product): void {
    this.editingProduct.set({ ...product });
    this.formOpen.set(true);
    this.successMsg.set(null);
    this.errorMsg.set(null);
  }

  onDelete(id: number): void {
    this.errorMsg.set(null);
    this.successMsg.set(null);

    this.productService.delete(id).subscribe({
      next: () => {
        this.successMsg.set('Producto eliminado del inventario.');
        if (this.editingProduct()?.id === id) {
          this.closeForm();
        }
        this.loadProducts();
      },
      error: (err: { status?: number }) => {
        if (err.status === 403) {
          this.errorMsg.set('Acceso denegado (403): solo ADMIN_ALMACEN puede eliminar productos.');
        } else {
          this.errorMsg.set('No se pudo eliminar el producto.');
        }
      }
    });
  }
}