export interface Product {
  id?: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category?: string;
  currency?: string;
  minStock?: number;
  unitVolumeM3?: number;
  unitWeightKg?: number;
}

export interface InventoryMovement {
  id?: number;
  productId?: number;
  productName?: string;
  movementType: 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'REINTEGRO' | string;
  quantity: number;
  stockAfter: number;
  reference?: string;
  createdAt?: string;
}