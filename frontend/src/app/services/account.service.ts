import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/accounts`;

  createAccount(accountData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, accountData);
  }

  getPendingAccounts(params: { branchId?: number; page?: number; size?: number }): Observable<any> {
    let url = `${this.apiUrl}/pending?page=${params.page || 0}&size=${params.size || 10}`;
    if (params.branchId) url += `&branchId=${params.branchId}`;
    return this.http.get<any>(url);
  }

  getAccounts(params: { userId?: number; page?: number; size?: number }): Observable<any> {
    let url = `${this.apiUrl}?page=${params.page || 0}&size=${params.size || 10}`;
    if (params.userId) url += `&userId=${params.userId}`;
    return this.http.get<any>(url);
  }

  getAccountById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  updateAccount(id: number, accountData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, accountData);
  }

  patchAccount(id: number, patchData: { status: string }): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, patchData);
  }

  deleteAccount(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
