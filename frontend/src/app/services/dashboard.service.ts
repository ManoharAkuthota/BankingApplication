import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/dashboard`;

  getDashboardSummary(role?: string, branchId?: number | null, userId?: number | null): Observable<any> {
    const params: any = {};
    if (role) params.role = role;
    if (branchId) params.branchId = branchId.toString();
    if (userId) params.userId = userId.toString();
    return this.http.get<any>(`${this.apiUrl}/summary`, { params });
  }
}
