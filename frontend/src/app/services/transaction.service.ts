import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/transactions`;

  deposit(data: { targetAccountNumber: string; amount: number; description?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/deposit`, data);
  }

  withdraw(data: { sourceAccountNumber: string; amount: number; description?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/withdraw`, data);
  }

  transfer(data: { sourceAccountNumber: string; targetAccountNumber: string; amount: number; description?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/transfer`, data);
  }

  getTransactionHistory(accountNumber?: string, page = 0, size = 10): Observable<any> {
    let url = `${this.apiUrl}/history?page=${page}&size=${size}`;
    if (accountNumber) {
      url += `&accountNumber=${accountNumber}`;
    }
    return this.http.get<any>(url);
  }
}
