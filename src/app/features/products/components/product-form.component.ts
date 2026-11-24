import { Component, effect, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Product } from '../../../shared/models/product.model';

@Component({
  selector: 'app-product-form',
  imports: [FormsModule],
  template: `
    @if (canManage()) {
      <div class="panel">
        <div class="panel-header">
          <h3>{{ editingProduct()?.id ? 'Editar producto #' + editingProduct()?.id : 'Nuevo producto' }}</h3>
          <button type="button" class="btn-close" (click)="cancelEdit.emit()" title="Cerrar formulario">✕</button>
        </div>

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
              <label for="prodCat">Categoría / Grupo</label>
              <input
                id="prodCat"
                name="prodCat"
                type="text"
                [(ngModel)]="model.category"
                placeholder="Ej. Embalaje, Oficina"
              />
            </div>

            <div class="field">
              <label for="prodCurr">Moneda</label>
              <select id="prodCurr" name="prodCurr" [(ngModel)]="model.currency">
                <option value="PEN">PEN (S/)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
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
              <label for="prodStock">Stock actual *</label>
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

          <div class="field-row-3">
            <div class="field">
              <label for="prodMinStock">Stock mínimo</label>
              <input
                id="prodMinStock"
                name="prodMinStock"
                type="number"
                min="0"
                [(ngModel)]="model.minStock"
              />
            </div>

            <div class="field">
              <label for="prodWeight">Peso (kg)</label>
              <input
                id="prodWeight"
                name="prodWeight"
                type="number"
                step="0.01"
                min="0"
                [(ngModel)]="model.unitWeightKg"
              />
            </div>

            <div class="field">
              <label for="prodVol">Volumen (m³)</label>
              <input
                id="prodVol"
                name="prodVol"
                type="number"
                step="0.001"
                min="0"
                [(ngModel)]="model.unitVolumeM3"
              />
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary" [disabled]="saving()">
              {{ saving() ? 'Guardando...' : (editingProduct()?.id ? 'Actualizar producto' : 'Guardar producto') }}
            </button>
            <button type="button" class="btn-secondary" (click)="cancelEdit.emit()">Cancelar</button>
          </div>
        </form>
      </div>
    } @else {
      <div class="panel info-panel">
        <div class="panel-header">
          <h3>Modo consulta</h3>
          <button type="button" class="btn-close" (click)="cancelEdit.emit()">✕</button>
        </div>
        <p>
          Solo el rol <strong>ADMIN_ALMACEN</strong> puede crear o editar productos en el catálogo.
        </p>
      </div>
    }
  `,
  styles: [`
    .panel {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 1.15rem;
      min-width: 0;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.9rem;
    }
    h3 { margin: 0; font-size: 1.02rem; color: #0f172a; }
    .btn-close {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      width: 30px;
      height: 30px;
      cursor: pointer;
      color: #475569;
      font-weight: 700;
    }
    .info-panel p { color: #475569; font-size: 0.9rem; line-height: 1.5; margin: 0; }

    .product-form { display: flex; flex-direction: column; gap: 0.8rem; }
    .field-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.7rem;
    }
    .field-row-3 {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.55rem;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.28rem;
      min-width: 0;
    }
    label { font-size: 0.8rem; font-weight: 600; color: #334155; }
    input, select {
      width: 100%;
      box-sizing: border-box;
      min-width: 0;
      padding: 0.52rem 0.65rem;
      border: 1px solid #cbd5e1;
      border-radius: 9px;
      font-size: 0.88rem;
      background: #ffffff;
    }
    input:focus, select:focus { outline: none; border-color: #ea580c; }

    .form-actions { display: flex; gap: 0.6rem; flex-wrap: wrap; margin-top: 0.25rem; }
    .btn-primary {
      background: #ea580c; color: #fff; border: none; border-radius: 9px;
      padding: 0.58rem 0.95rem; font-weight: 600; font-size: 0.88rem; cursor: pointer;
    }
    .btn-primary:hover:not(:disabled) { background: #c2410c; }
    .btn-secondary {
      background: #fff; color: #1e293b; border: 1px solid #cbd5e1; border-radius: 9px;
      padding: 0.55rem 0.85rem; font-weight: 600; font-size: 0.85rem; cursor: pointer;
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
            category: current.category ?? '',
            currency: current.currency ?? 'PEN',
            price: current.price,
            stock: current.stock,
            minStock: current.minStock ?? 10,
            unitWeightKg: current.unitWeightKg,
            unitVolumeM3: current.unitVolumeM3
          }
        : this.emptyProduct();
    });
  }

  submitForm(): void {
    this.saveProduct.emit({
      id: this.model.id,
      name: this.model.name.trim(),
      description: this.model.description?.trim() || '',
      category: this.model.category?.trim() || undefined,
      currency: this.model.currency || 'PEN',
      price: Number(this.model.price),
      stock: Number(this.model.stock),
      minStock: this.model.minStock != null ? Number(this.model.minStock) : 10,
      unitWeightKg: this.model.unitWeightKg != null ? Number(this.model.unitWeightKg) : undefined,
      unitVolumeM3: this.model.unitVolumeM3 != null ? Number(this.model.unitVolumeM3) : undefined
    });
  }

  private emptyProduct(): Product {
    return {
      name: '',
      description: '',
      category: '',
      currency: 'PEN',
      price: 0,
      stock: 0,
      minStock: 10
    };
  }
}