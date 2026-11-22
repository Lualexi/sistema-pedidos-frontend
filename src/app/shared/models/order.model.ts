export interface OrderItem {
  id?: number;
  productId: number;
  productName?: string;
  quantity: number;
  subtotal?: number;
}

export interface Order {
  id?: number;
  customerName?: string;
  status?: string;
  total?: number;
  items: OrderItem[];
  createdAt?: string;
}