import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BranchService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/branches`;

  createBranch(branchData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, branchData);
  }

  getAllBranches(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  getBranchById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
}
