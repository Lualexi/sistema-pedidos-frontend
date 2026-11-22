import { Component, effect, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Product } from '../../../shared/models/product.model';

@Component({
  selector: 'app-product-form',
  imports: [FormsModule],
  template: `
    @if (canManage()) {
      <div class="panel">
        <h3>{{ editingProduct()?.id ? 'Editar producto #' + editingProduct()?.id : 'Registrar nuevo producto' }}</h3>

        <form (ngSubmit)="submitForm()" class="product-form">
          <div class="field">
            <label for="prodName">Nombre del producto *</label>
            <input
              id="prodName"
              name="prodName"
              type="text"
              required
              [(ngModel)]="model.name"
              placeholder="Ej. Caja de cartón corrugado"
            />
          </div>

          <div class="field">
            <label for="prodDesc">Descripción</label>
            <input
              id="prodDesc"
              name="prodDesc"
              type="text"
              [(ngModel)]="model.description"
              placeholder="Detalle, presentación o lote"
            />
          </div>

          <div class="field-row">
            <div class="field">
              <label for="prodPrice">Precio unitario *</label>
              <input
                id="prodPrice"
                name="prodPrice"
                type="number"
                step="0.01"
                min="0"
                required
                [(ngModel)]="model.price"
              />
            </div>

            <div class="field">
              <label for="prodStock">Stock inicial *</label>
              <input
                id="prodStock"
                name="prodStock"
                type="number"
                min="0"
                required
                [(ngModel)]="model.stock"
              />
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary" [disabled]="saving()">
              {{ saving() ? 'Guardando...' : (editingProduct()?.id ? 'Actualizar producto' : 'Guardar producto') }}
            </button>
            @if (editingProduct()?.id) {
              <button type="button" class="btn-secondary" (click)="cancelEdit.emit()">Cancelar</button>
            }
          </div>
        </form>
      </div>
    } @else {
      <div class="panel info-panel">
        <h3>Modo consulta</h3>
        <p>
          Solo el rol <strong>ADMIN_ALMACEN</strong> puede crear, editar o eliminar productos en el catálogo.
          Si necesitas gestionar inventario, inicia sesión con una cuenta de administrador de almacén.
        </p>
      </div>
    }
  `,
  styles: [`
    .panel {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 1.25rem;
      min-width: 0;
      overflow: hidden;
    }
    h3 { margin: 0 0 1rem; font-size: 1.05rem; color: #0f172a; }
    .info-panel p { color: #475569; font-size: 0.9rem; line-height: 1.5; margin: 0; }

    .product-form { display: flex; flex-direction: column; gap: 0.9rem; }
    .field-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.75rem;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      min-width: 0;
    }
    label { font-size: 0.84rem; font-weight: 600; color: #334155; }
    input[type="text"], input[type="number"] {
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
      min-width: 0;
      padding: 0.58rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 9px;
      font-size: 0.92rem;
    }
    input:focus { outline: none; border-color: #ea580c; }

    .form-actions { display: flex; gap: 0.6rem; flex-wrap: wrap; margin-top: 0.25rem; }
    .btn-primary {
      background: #ea580c; color: #fff; border: none; border-radius: 9px;
      padding: 0.62rem 1rem; font-weight: 600; font-size: 0.9rem; cursor: pointer;
    }
    .btn-primary:hover:not(:disabled) { background: #c2410c; }
    .btn-secondary {
      background: #fff; color: #1e293b; border: 1px solid #cbd5e1; border-radius: 9px;
      padding: 0.58rem 0.9rem; font-weight: 600; font-size: 0.88rem; cursor: pointer;
    }
  `]
})
export class ProductFormComponent {
  canManage = input.required<boolean>();
  saving = input<boolean>(false);
  editingProduct = input<Product | null>(null);

  saveProduct = output<Product>();
  cancelEdit = output<void>();

  model: Product = this.emptyProduct();

  constructor() {
    effect(() => {
      const current = this.editingProduct();
      this.model = current
        ? {
            id: current.id,
            name: current.name,
            description: current.description ?? '',
            price: current.price,
            stock: current.stock
          }
        : this.emptyProduct();
    });
  }

  submitForm(): void {
    this.saveProduct.emit({
      id: this.model.id,
      name: this.model.name.trim(),
      description: this.model.description?.trim() || '',
      price: Number(this.model.price),
      stock: Number(this.model.stock)
    });
  }

  private emptyProduct(): Product {
    return { name: '', description: '', price: 0, stock: 0 };
  }
}