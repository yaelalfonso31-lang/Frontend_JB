import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/auth'; // Dirección de tu backend Node.js

  solicitarCodigo(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/solicitar-codigo`, { email });
  }

  validarCodigo(email: string, codigo: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/validar-codigo`, { email, codigo });
  }

  actualizarPassword(email: string, codigo: string, nuevaPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/actualizar-password`, { email, codigo, nuevaPassword });
  }
}