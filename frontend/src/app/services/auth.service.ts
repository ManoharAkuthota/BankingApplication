import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.loadCurrentUser();
  }

  login(credentials: any, role?: string): Observable<any> {
    const url = role ? `${this.apiUrl}/login/${role.toLowerCase()}` : `${this.apiUrl}/login`;
    return this.http.post<any>(url, credentials).pipe(
      tap(response => {
        if (response && response.success && response.data && response.data.token) {
          sessionStorage.setItem('token', response.data.token);
          this.loadCurrentUser();
        }
      })
    );
  }

  logout(): void {
    sessionStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, userData);
  }

  getUser(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  getAllUsers(params: { role?: string; branchId?: number; page?: number; size?: number }): Observable<any> {
    let url = `${this.apiUrl}?page=${params.page || 0}&size=${params.size || 10}`;
    if (params.role) url += `&role=${params.role}`;
    if (params.branchId) url += `&branchId=${params.branchId}`;
    return this.http.get<any>(url);
  }

  updateUser(id: number, userData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, userData);
  }

  patchUser(id: number, userData: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, userData);
  }

  getUserDropdown(role?: string): Observable<any> {
    let url = `${this.apiUrl}/dropdown`;
    if (role) url += `?role=${role}`;
    return this.http.get<any>(url);
  }

  getToken(): string | null {
    return sessionStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const decoded = this.decode(token);
      if (!decoded) return false;
      
      // Check token expiration
      const expirationDate = decoded.exp * 1000;
      return expirationDate > Date.now();
    } catch (e) {
      return false;
    }
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  private loadCurrentUser(): void {
    const token = this.getToken();
    if (token) {
      const decoded = this.decode(token);
      if (decoded) {
        this.currentUserSubject.next({
          username: decoded.sub,
          email: decoded.email,
          phoneNumber: decoded.phoneNumber,
          alternativePhoneNumber: decoded.alternativePhoneNumber,
          role: decoded.role,
          userId: decoded.userId,
          branchId: decoded.branchId,
          branchName: decoded.branchName,
          exp: decoded.exp
        });
        return;
      }
    }
    this.currentUserSubject.next(null);
  }

  private decode(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }
}
