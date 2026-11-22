import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080';

  getHealthStatus(): Observable<string> {
    return this.http.get(`${this.baseUrl}/api/auth/health`, { responseType: 'text' });
  }
}