import { Component } from '@angular/core';

@Component({
  selector: 'app-warehouses-page',
  template: `
    <section class="card">
      <h2>Gestión de Almacenes (WMS) y Flujos Logísticos</h2>
      <p>Recepción de mercancía, ubicación, preparación (picking), despacho y reglas de movimiento.</p>
    </section>
  `,
  styles: [`.card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.5rem; } h2 { margin-top: 0; } p { color: #475569; margin-bottom: 0; }`]
})
export class WarehousesPage {}