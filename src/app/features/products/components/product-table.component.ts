import { Component, computed, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from '../../../shared/models/product.model';

@Component({
  selector: 'app-product-table',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="panel">
      <div class="table-toolbar">
        <div class="search-group">
          <input
            type="text"
            class="search-input"
            [(ngModel)]="searchInput"
            (keydown.enter)="triggerSearch()"
            placeholder="Buscar en catálogo (lupa consulta BD)..."
          />
          @if (searchInput) {
            <button type="button" class="btn-icon" (click)="clearSearch()" title="Limpiar búsqueda">
              &times;
            </button>
          }
          <button type="button" class="btn-search" (click)="triggerSearch()" title="Buscar en base de datos">
            &#128269;
          </button>
        </div>

        <label class="checkbox-filter">
          <input
            type="checkbox"
            [checked]="onlyLowStock()"
            (change)="toggleLowStock()"
          />
          Solo stock crítico (&le; 10)
        </label>
      </div>

      <div class="table-wrap">
        <table class="inv-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Producto</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
              @if (canManage()) {
                <th>Acciones</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (item of pagedProducts(); track item.id ?? item.name) {
              <tr>
                <td>#{{ item.id ?? '-' }}</td>
                <td>
                  <div class="prod-name">{{ item.name }}</div>
                  @if (item.description) {
                    <div class="prod-desc">{{ item.description }}</div>
                  }
                </td>
                <td>{{ item.price | number: '1.2-2' }}</td>
                <td><strong>{{ item.stock }}</strong></td>
                <td>
                  @if (item.stock <= 0) {
                    <span class="badge badge--out">Sin stock</span>
                  } @else if (item.stock <= 10) {
                    <span class="badge badge--low">Stock crítico</span>
                  } @else {
                    <span class="badge badge--ok">Disponible</span>
                  }
                </td>
                @if (canManage()) {
                  <td class="actions-cell">
                    <button type="button" class="btn-mini" (click)="editProduct.emit(item)">Editar</button>
                    @if (item.id != null) {
                      <button type="button" class="btn-mini btn-mini--danger" (click)="deleteProduct.emit(item.id)">Eliminar</button>
                    }
                  </td>
                }
              </tr>
            } @empty {
              <tr>
                <td [attr.colspan]="canManage() ? 6 : 5" class="empty-cell">
                  No hay productos que coincidan con el criterio actual.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (filteredProducts().length > 0) {
        <div class="pagination-bar">
          <span class="page-info">
            Mostrando {{ rangeStart() }}–{{ rangeEnd() }} de {{ filteredProducts().length }}
            (Bloque {{ currentPage() }} / {{ totalPages() }})
          </span>

          <div class="page-arrows">
            <button
              type="button"
              class="arrow-btn"
              (click)="prevPage()"
              [disabled]="currentPage() <= 1"
              aria-label="Bloque anterior"
            >
              &lsaquo;
            </button>
            <button
              type="button"
              class="arrow-btn"
              (click)="nextPage()"
              [disabled]="currentPage() >= totalPages()"
              aria-label="Siguiente bloque"
            >
              &rsaquo;
            </button>
          </div>
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
    .table-toolbar {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .search-group {
      display: flex;
      align-items: center;
      flex: 1 1 260px;
      min-width: 0;
      border: 1px solid #cbd5e1;
      border-radius: 9px;
      background: #fff;
      overflow: hidden;
    }
    .search-group:focus-within {
      border-color: #ea580c;
    }
    .search-input {
      flex: 1;
      min-width: 0;
      border: none;
      padding: 0.55rem 0.75rem;
      font-size: 0.9rem;
      outline: none;
    }
    .btn-icon {
      border: none;
      background: transparent;
      color: #64748b;
      padding: 0 0.45rem;
      font-size: 1rem;
      cursor: pointer;
    }
    .btn-search {
      border: none;
      background: #f8fafc;
      border-left: 1px solid #e2e8f0;
      padding: 0.55rem 0.75rem;
      cursor: pointer;
      font-size: 0.9rem;
    }
    .btn-search:hover {
      background: #fff7ed;
    }

    .checkbox-filter {
      display: flex; align-items: center; gap: 0.45rem;
      font-size: 0.85rem; color: #334155; font-weight: 500; cursor: pointer;
    }

    .table-wrap { overflow-x: auto; }
    .inv-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    .inv-table th, .inv-table td {
      text-align: left; padding: 0.65rem 0.65rem; border-bottom: 1px solid #e2e8f0;
    }
    .inv-table th { font-size: 0.78rem; text-transform: uppercase; color: #64748b; background: #f8fafc; }
    .prod-name { font-weight: 600; color: #0f172a; }
    .prod-desc { font-size: 0.8rem; color: #64748b; }

    .badge {
      display: inline-block; padding: 0.2rem 0.55rem; border-radius: 999px;
      font-size: 0.75rem; font-weight: 700;
    }
    .badge--ok { background: #dcfce7; color: #15803d; }
    .badge--low { background: #ffedd5; color: #c2410c; }
    .badge--out { background: #fee2e2; color: #b91c1c; }

    .actions-cell { display: flex; gap: 0.4rem; flex-wrap: wrap; }
    .btn-mini {
      padding: 0.3rem 0.6rem; border-radius: 7px; border: 1px solid #cbd5e1;
      background: #fff; color: #1e293b; font-size: 0.78rem; font-weight: 600; cursor: pointer;
    }
    .btn-mini:hover { background: #f1f5f9; }
    .btn-mini--danger { border-color: #fecaca; color: #b91c1c; background: #fef2f2; }
    .btn-mini--danger:hover { background: #fee2e2; }
    .empty-cell { text-align: center; color: #64748b; padding: 1.5rem !important; }

    .pagination-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.85rem;
      padding-top: 0.65rem;
      font-size: 0.8rem;
      color: #64748b;
    }
    .page-arrows {
      display: flex;
      gap: 0.35rem;
    }
    .arrow-btn {
      width: 30px;
      height: 28px;
      border-radius: 7px;
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #1e293b;
      font-size: 1rem;
      line-height: 1;
      cursor: pointer;
    }
    .arrow-btn:hover:not(:disabled) {
      background: #fff7ed;
      border-color: #fdba74;
      color: #c2410c;
    }
    .arrow-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  `]
})
export class ProductTableComponent {
  products = input.required<Product[]>();
  canManage = input.required<boolean>();

  editProduct = output<Product>();
  deleteProduct = output<number>();
  searchDb = output<string>();

  readonly pageSize = 10;
  searchInput = '';
  activeQuery = signal('');
  onlyLowStock = signal(false);
  currentPage = signal(1);

  constructor() {
    effect(() => {
      this.products();
      this.currentPage.set(1);
    });
  }

  triggerSearch(): void {
    this.activeQuery.set(this.searchInput.trim());
    this.currentPage.set(1);
    this.searchDb.emit(this.searchInput.trim());
  }

  clearSearch(): void {
    this.searchInput = '';
    this.activeQuery.set('');
    this.currentPage.set(1);
    this.searchDb.emit('');
  }

  toggleLowStock(): void {
    this.onlyLowStock.update((v) => !v);
    this.currentPage.set(1);
  }

  filteredProducts = computed(() => {
    const query = this.activeQuery().toLowerCase();
    const lowOnly = this.onlyLowStock();

    return this.products().filter((p) => {
      const matchesQuery =
        !query ||
        p.name.toLowerCase().includes(query) ||
        (p.description ?? '').toLowerCase().includes(query);
      const matchesStock = !lowOnly || p.stock <= 10;
      return matchesQuery && matchesStock;
    });
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredProducts().length / this.pageSize)));

  pagedProducts = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * this.pageSize;
    return this.filteredProducts().slice(start, start + this.pageSize);
  });

  rangeStart = computed(() => {
    if (this.filteredProducts().length === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize + 1;
  });

  rangeEnd = computed(() => {
    return Math.min(this.currentPage() * this.pageSize, this.filteredProducts().length);
  });

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
    }
  }
}