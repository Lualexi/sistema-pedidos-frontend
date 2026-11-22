import { Component } from '@angular/core';

@Component({
  selector: 'app-purchases-page',
  template: `
    <section class="card">
      <h2>Compras, Abastecimiento y Proveedores</h2>
      <p>Solicitudes de compra, reposición por niveles mínimos/máximos y directorio de proveedores.</p>
    </section>
  `,
  styles: [`.card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.5rem; } h2 { margin-top: 0; } p { color: #475569; margin-bottom: 0; }`]
})
export class PurchasesPage {}