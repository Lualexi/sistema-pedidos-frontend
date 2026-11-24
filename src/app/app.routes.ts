import { Routes } from '@angular/router';
import { DashboardPage } from './features/dashboard/components/dashboard.page';
import { LoginPage } from './features/auth/components/login.page';
import { InventoryPage } from './features/products/components/inventory.page';
import { OrdersPage } from './features/orders/components/orders.page';
import { WarehousesPage } from './features/warehouses/components/warehouses.page';
import { PurchasesPage } from './features/purchases/components/purchases.page';
import { SettingsPage } from './features/settings/components/settings.page';
import { moduleGuard } from './core/guards/module.guard';

export const routes: Routes = [
  { path: '', component: DashboardPage },
  { path: 'login', component: LoginPage },
  { path: 'pedidos', component: OrdersPage, canActivate: [moduleGuard('PEDIDOS')] },
  { path: 'inventario', component: InventoryPage, canActivate: [moduleGuard('INVENTARIO')] },
  { path: 'almacenes', component: WarehousesPage, canActivate: [moduleGuard('ALMACENES')] },
  { path: 'compras', component: PurchasesPage, canActivate: [moduleGuard('COMPRAS')] },
  { path: 'configuracion', component: SettingsPage, canActivate: [moduleGuard('CONFIGURACION')] },
  { path: '**', redirectTo: '' }
];