import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = '/api';

  solicitarCodigo(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/solicitar-codigo`, { email });
  }

  validarCodigo(email: string, codigo: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/validar-codigo`, { email, codigo });
  }

  restablecerPassword(email: string, codigo: string, nuevaPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/restablecer-password`, {
      email,
      codigo,
      nuevaPassword
    });
  }

  registrarColaborador(
    nombreCompleto: string,
    email: string,
    password: string,
    rol: string,
    mensajeNota: string
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/colaboradores/solicitudes`, {
      nombre: nombreCompleto,
      email,
      password,
      telefono: 'Por asignar',
      razonSocial: rol,
      experiencia: mensajeNota || 'Sin mensaje adicional'
    });
  }
}