export interface Vehicle {
  id?: number;
  plate: string;
  name: string;
  maxWeightKg: number;
  maxVolumeM3: number;
  status: 'DISPONIBLE' | 'EN_RUTA' | 'MANTENIMIENTO' | string;
  availableFrom?: string;
}

export interface RouteTariff {
  id?: number;
  origin: string;
  destination: string;
  roundTripCost: number;
  estimatedHours: number;
}

export interface Supplier {
  id?: number;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
}

export interface PurchaseOrderItem {
  id?: number;
  productId: number;
  productName?: string;
  quantity: number;
  unitPrice: number;
}

export interface PurchaseOrder {
  id?: number;
  referenceCode?: string;
  docType?: 'ORDEN_COMPRA' | 'COTIZACION' | string;
  supplierId?: number;
  supplier?: Supplier;
  totalAmount?: number;
  status?: string;
  createdAt?: string;
  items?: PurchaseOrderItem[];
}

export interface SystemSetting {
  id?: number;
  moduleKey: string;
  settingKey: string;
  settingValue: string;
  description?: string;
}