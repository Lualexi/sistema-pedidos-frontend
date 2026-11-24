import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PurchaseOrder, Supplier } from '../../../shared/models/logistics.model';
import { Product } from '../../../shared/models/product.model';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-purchases-page',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="pur-header">
      <div>
        <h2>Compras, Proveedores y Reabastecimiento</h2>
        <p class="subtitle">Registro de cotizaciones/órdenes de compra e ingreso directo al inventario.</p>
      </div>
      <div class="tabs">
        <button type="button" class="tab-btn" [class.active]="tab() === 'ORDERS'" (click)="tab.set('ORDERS')">
          📄 Órdenes / Cotizaciones ({{ purchaseOrders().length }})
        </button>
        <button type="button" class="tab-btn" [class.active]="tab() === 'SUPPLIERS'" (click)="tab.set('SUPPLIERS')">
          🏢 Proveedores ({{ suppliers().length }})
        </button>
      </div>
    </section>

    @if (errorMsg()) {
      <div class="alert alert--error">{{ errorMsg() }}</div>
    }
    @if (successMsg()) {
      <div class="alert alert--success">{{ successMsg() }}</div>
    }

    @if (tab() === 'ORDERS') {
      <section class="grid-2">
        @if (isAdmin()) {
          <article class="panel">
            <h3>Nueva orden / cotización de compra</h3>
            <form (ngSubmit)="createPurchaseOrder()" class="form-stack">
              <div class="row-2">
                <div class="field">
                  <label>Tipo documento</label>
                  <select name="docType" [(ngModel)]="docType">
                    <option value="ORDEN_COMPRA">Orden de Compra</option>
                    <option value="COTIZACION">Cotización Proveedor</option>
                  </select>
                </div>
                <div class="field">
                  <label>Proveedor *</label>
                  <select name="supplierId" required [(ngModel)]="selectedSupplierId">
                    <option [ngValue]="null">Selecciona proveedor...</option>
                    @for (s of suppliers(); track s.id ?? s.name) {
                      <option [ngValue]="s.id">{{ s.name }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="field">
                <label>Producto a reabastecer *</label>
                <select name="prodId" required [(ngModel)]="selectedProductId">
                  <option [ngValue]="null">Selecciona producto...</option>
                  @for (p of products(); track p.id ?? p.name) {
                    <option [ngValue]="p.id">{{ p.name }} (Stock actual: {{ p.stock }})</option>
                  }
                </select>
              </div>

              <div class="row-2">
                <div class="field">
                  <label>Cantidad *</label>
                  <input type="number" name="qty" min="1" required [(ngModel)]="quantity" />
                </div>
                <div class="field">
                  <label>Costo unitario *</label>
                  <input type="number" name="unitPrice" min="0" step="0.01" required [(ngModel)]="unitPrice" />
                </div>
              </div>

              <button type="submit" class="btn-primary">Registrar compra</button>
            </form>
          </article>
        }

        <article class="panel">
          <h3>Historial de abastecimiento</h3>
          <div class="cards-list">
            @for (po of purchaseOrders(); track po.id ?? po.referenceCode) {
              <div class="item-card">
                <div>
                  <strong>{{ po.referenceCode }}</strong>
                  <span class="pill" style="margin-left: 0.4rem;">{{ po.docType }}</span>
                  <div class="meta">
                    Proveedor: {{ po.supplier?.name || 'Proveedor' }} · Total: {{ po.totalAmount | number: '1.2-2' }}
                  </div>
                </div>
                <div class="actions">
                  <span class="pill">{{ po.status }}</span>
                  @if (isAdmin() && po.status !== 'RECIBIDO' && po.id != null) {
                    <button type="button" class="btn-receive" (click)="receiveOrder(po.id)">
                      Recepcionar en almacén
                    </button>
                  }
                </div>
              </div>
            } @empty {
              <p class="empty">Aún no hay órdenes de compra registradas.</p>
            }
          </div>
        </article>
      </section>
    }

    @if (tab() === 'SUPPLIERS') {
      <section class="grid-2">
        @if (isAdmin()) {
          <article class="panel">
            <h3>Registrar proveedor</h3>
            <form (ngSubmit)="createSupplier()" class="form-stack">
              <div class="field">
                <label>Razón social / Nombre *</label>
                <input type="text" name="sname" required [(ngModel)]="newSupplier.name" placeholder="Ej. Papelera Industrial SAC" />
              </div>
              <div class="field">
                <label>Persona de contacto</label>
                <input type="text" name="scontact" [(ngModel)]="newSupplier.contact" placeholder="Ej. Carlos Gómez" />
              </div>
              <div class="row-2">
                <div class="field">
                  <label>Teléfono</label>
                  <input type="text" name="sphone" [(ngModel)]="newSupplier.phone" />
                </div>
                <div class="field">
                  <label>Correo</label>
                  <input type="email" name="semail" [(ngModel)]="newSupplier.email" />
                </div>
              </div>
              <button type="submit" class="btn-primary">Guardar proveedor</button>
            </form>
          </article>
        }

        <article class="panel">
          <h3>Directorio de proveedores</h3>
          <div class="cards-list">
            @for (s of suppliers(); track s.id ?? s.name) {
              <div class="item-card">
                <div>
                  <strong>{{ s.name }}</strong>
                  <div class="meta">
                    {{ s.contact || 'Sin contacto' }} · {{ s.phone || 'Sin teléfono' }} · {{ s.email || '' }}
                  </div>
                </div>
                @if (isAdmin() && s.id != null) {
                  <button type="button" class="btn-danger" (click)="deleteSupplier(s.id)">Eliminar</button>
                }
              </div>
            } @empty {
              <p class="empty">No hay proveedores registrados.</p>
            }
          </div>
        </article>
      </section>
    }
  `,
  styles: [`
    .pur-header {
      display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center;
      gap: 1rem; margin-bottom: 1.25rem;
    }
    h2 { margin: 0; font-size: 1.4rem; color: #0f172a; }
    .subtitle { margin: 0.25rem 0 0; color: #64748b; font-size: 0.9rem; }
    .tabs { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .tab-btn {
      border: 1px solid #cbd5e1; background: #fff; color: #334155;
      border-radius: 9px; padding: 0.52rem 0.9rem; font-weight: 600; font-size: 0.85rem; cursor: pointer;
    }
    .tab-btn.active { background: #ea580c; color: #fff; border-color: #ea580c; }

    .grid-2 { display: grid; grid-template-columns: 1fr; gap: 1.25rem; align-items: start; }
    @media (min-width: 960px) { .grid-2 { grid-template-columns: 380px minmax(0, 1fr); } }

    .panel {
      background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.2rem;
    }
    h3 { margin: 0 0 0.9rem; font-size: 1.02rem; color: #0f172a; }

    .form-stack { display: flex; flex-direction: column; gap: 0.8rem; }
    .row-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.65rem; }
    .field { display: flex; flex-direction: column; gap: 0.25rem; }
    label { font-size: 0.8rem; font-weight: 600; color: #334155; }
    input, select {
      width: 100%; box-sizing: border-box; padding: 0.52rem 0.65rem;
      border: 1px solid #cbd5e1; border-radius: 9px; font-size: 0.86rem;
    }
    .btn-primary {
      background: #ea580c; color: #fff; border: none; border-radius: 9px;
      padding: 0.6rem 1rem; font-weight: 600; cursor: pointer;
    }
    .btn-receive {
      background: #15803d; color: #fff; border: none; border-radius: 8px;
      padding: 0.35rem 0.7rem; font-size: 0.78rem; font-weight: 600; cursor: pointer;
    }
    .btn-danger {
      background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;
      border-radius: 7px; padding: 0.3rem 0.6rem; font-size: 0.78rem; font-weight: 600; cursor: pointer;
    }

    .cards-list { display: flex; flex-direction: column; gap: 0.65rem; }
    .item-card {
      display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center;
      gap: 0.6rem; padding: 0.75rem 0.9rem; border: 1px solid #e2e8f0; border-radius: 10px; background: #f8fafc;
    }
    .actions { display: flex; gap: 0.45rem; align-items: center; }
    .meta { font-size: 0.8rem; color: #64748b; margin-top: 0.15rem; }
    .pill {
      font-size: 0.74rem; font-weight: 700; padding: 0.18rem 0.55rem;
      border-radius: 999px; background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa;
    }
    .empty { margin: 0; color: #64748b; font-size: 0.88rem; }
    .alert { padding: 0.7rem 1rem; border-radius: 10px; margin-bottom: 1rem; font-size: 0.86rem; }
    .alert--error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
    .alert--success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
  `]
})
export class PurchasesPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = 'http://localhost:8080/api/purchases';

  tab = signal<'ORDERS' | 'SUPPLIERS'>('ORDERS');
  suppliers = signal<Supplier[]>([]);
  purchaseOrders = signal<PurchaseOrder[]>([]);
  products = signal<Product[]>([]);
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  isAdmin = computed(() => this.authService.currentRole() === 'ADMIN_ALMACEN');

  newSupplier: Supplier = { name: '', contact: '', phone: '', email: '' };
  docType: 'ORDEN_COMPRA' | 'COTIZACION' = 'ORDEN_COMPRA';
  selectedSupplierId: number | null = null;
  selectedProductId: number | null = null;
  quantity = 10;
  unitPrice = 0;

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.http.get<Supplier[]>(`${this.apiUrl}/suppliers`).subscribe({
      next: (list) => this.suppliers.set(list ?? []),
      error: () => {}
    });

    this.http.get<PurchaseOrder[]>(`${this.apiUrl}/orders`).subscribe({
      next: (list) => this.purchaseOrders.set(list ?? []),
      error: () => {}
    });

    this.http.get<Product[]>('http://localhost:8080/api/products').subscribe({
      next: (list) => this.products.set(list ?? []),
      error: () => {}
    });
  }

  createSupplier(): void {
    this.errorMsg.set(null);
    this.http.post<Supplier>(`${this.apiUrl}/suppliers`, this.newSupplier).subscribe({
      next: () => {
        this.successMsg.set('Proveedor registrado.');
        this.newSupplier = { name: '', contact: '', phone: '', email: '' };
        this.loadAll();
      },
      error: () => this.errorMsg.set('No se pudo registrar el proveedor.')
    });
  }

  deleteSupplier(id: number): void {
    this.http.delete<void>(`${this.apiUrl}/suppliers/${id}`).subscribe({
      next: () => {
        this.successMsg.set('Proveedor eliminado.');
        this.loadAll();
      },
      error: () => this.errorMsg.set('No se pudo eliminar el proveedor.')
    });
  }

  createPurchaseOrder(): void {
    this.errorMsg.set(null);
    if (!this.selectedSupplierId || !this.selectedProductId || this.quantity <= 0) {
      this.errorMsg.set('Selecciona proveedor, producto y cantidad válida.');
      return;
    }

    const payload = {
      docType: this.docType,
      supplier: { id: this.selectedSupplierId },
      items: [
        {
          product: { id: this.selectedProductId },
          quantity: Number(this.quantity),
          unitPrice: Number(this.unitPrice)
        }
      ]
    };

    this.http.post<PurchaseOrder>(`${this.apiUrl}/orders`, payload).subscribe({
      next: () => {
        this.successMsg.set('Documento de compra registrado.');
        this.selectedProductId = null;
        this.quantity = 10;
        this.unitPrice = 0;
        this.loadAll();
      },
      error: () => this.errorMsg.set('No se pudo registrar la orden de compra.')
    });
  }

  receiveOrder(id: number): void {
    this.errorMsg.set(null);
    this.http.patch<PurchaseOrder>(`${this.apiUrl}/orders/${id}/receive`, {}).subscribe({
      next: () => {
        this.successMsg.set('Mercadería recepcionada y stock actualizado en Kardex.');
        this.loadAll();
      },
      error: () => this.errorMsg.set('No se pudo recepcionar la orden.')
    });
  }
}