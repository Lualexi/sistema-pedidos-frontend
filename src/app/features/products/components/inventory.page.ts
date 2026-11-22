import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Product } from '../../../shared/models/product.model';
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
        <p class="subtitle">Control de existencias, precios y alertas de stock para Distribuciones C&amp;M.</p>
      </div>
      <div class="header-actions">
        <span class="role-pill">Rol actual: {{ authService.currentRole() || 'SIN SESIÓN' }}</span>
        <button type="button" class="btn-secondary" (click)="loadProducts()" [disabled]="loading()">
          {{ loading() ? 'Actualizando...' : 'Actualizar' }}
        </button>
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

    <section class="inv-layout">
      <div class="left-col">
        <app-product-form
          [canManage]="canManageProducts()"
          [saving]="saving()"
          [editingProduct]="editingProduct()"
          (saveProduct)="onSaveProduct($event)"
          (cancelEdit)="editingProduct.set(null)"
        />
      </div>

      <div class="right-col">
        <app-product-table
          [products]="products()"
          [canManage]="canManageProducts()"
          (editProduct)="startEdit($event)"
          (deleteProduct)="onDelete($event)"
          (searchDb)="onSearchDb($event)"
        />
      </div>
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
    @media (min-width: 960px) {
      .inv-layout { grid-template-columns: 360px minmax(0, 1fr); }
      
      /* AQUÍ ESTÁ EL CSS PARA MANTENER FIJO EL FORMULARIO */
      .left-col {
        position: sticky;
        top: 5.5rem;
      }
    }
    .left-col, .right-col { min-width: 0; }

    .alert { padding: 0.75rem 1rem; border-radius: 10px; margin-bottom: 1rem; font-size: 0.88rem; font-weight: 500; }
    .alert--error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
    .alert--success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
  `]
})
export class InventoryPage implements OnInit {
  private readonly productService = inject(ProductService);
  readonly authService = inject(AuthService);

  products = signal<Product[]>([]);
  loading = signal(false);
  saving = signal(false);
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);
  editingProduct = signal<Product | null>(null);
  
  // PROPIEDAD AGREGADA AQUÍ
  lastSearch = signal('');

  canManageProducts = computed(() => this.authService.currentRole() === 'ADMIN_ALMACEN');
  lowStockCount = computed(() => this.products().filter((p) => p.stock <= 10).length);
  totalUnits = computed(() => this.products().reduce((acc, p) => acc + (p.stock || 0), 0));
  totalValue = computed(() => this.products().reduce((acc, p) => acc + (p.price || 0) * (p.stock || 0), 0));

  ngOnInit(): void {
    this.loadProducts();
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
        this.editingProduct.set(null);
        this.loadProducts();
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
          this.editingProduct.set(null);
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