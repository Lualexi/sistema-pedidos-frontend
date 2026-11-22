import { Routes } from '@angular/router';
import { DashboardPage } from './features/dashboard/components/dashboard.page';
import { LoginPage } from './features/auth/components/login.page';
import { InventoryPage } from './features/products/components/inventory.page';
import { OrdersPage } from './features/orders/components/orders.page';
import { WarehousesPage } from './features/warehouses/components/warehouses.page';
import { PurchasesPage } from './features/purchases/components/purchases.page';

export const routes: Routes = [
  { path: '', component: DashboardPage },
  { path: 'login', component: LoginPage },
  { path: 'pedidos', component: OrdersPage },
  { path: 'inventario', component: InventoryPage },
  { path: 'almacenes', component: WarehousesPage },
  { path: 'compras', component: PurchasesPage },
  { path: '**', redirectTo: '' }
];