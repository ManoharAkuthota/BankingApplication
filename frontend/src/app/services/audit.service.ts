import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/audit-logs`;

  getAuditLogs(params: { action?: string; branchId?: number; actionBy?: string; role?: string; page?: number; size?: number }): Observable<any> {
    let url = `${this.apiUrl}?page=${params.page || 0}&size=${params.size || 10}`;
    if (params.action) {
      url += `&action=${params.action}`;
    }
    if (params.branchId) {
      url += `&branchId=${params.branchId}`;
    }
    if (params.actionBy) {
      url += `&actionBy=${params.actionBy}`;
    }
    if (params.role) {
      url += `&role=${params.role}`;
    }
    return this.http.get<any>(url);
  }
}
