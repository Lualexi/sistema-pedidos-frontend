import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InventoryMovement, Product } from '../../../shared/models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/products';

  getAll(search?: string): Observable<Product[]> {
    const trimmed = search?.trim();
    const params = trimmed ? new HttpParams().set('search', trimmed) : undefined;
    return this.http.get<Product[]>(this.baseUrl, { params });
  }

  getMovements(productId?: number): Observable<InventoryMovement[]> {
    const params = productId != null ? new HttpParams().set('productId', productId) : undefined;
    return this.http.get<InventoryMovement[]>(`${this.baseUrl}/movements`, { params });
  }

  create(product: Product): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, product);
  }

  update(id: number, product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/${id}`, product);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}