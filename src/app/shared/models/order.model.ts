export interface OrderItem {
  id?: number;
  productId: number;
  productName?: string;
  quantity: number;
  price?: number;
}

export interface Order {
  id?: number;
  customerName?: string;
  date?: string;
  total?: number;
  status?: string;
  orderType?: 'ORDEN' | 'COTIZ' | string;
  destination?: string;
  shippingCost?: number;
  items: OrderItem[];
}