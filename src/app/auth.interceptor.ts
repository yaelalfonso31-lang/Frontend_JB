import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. Buscamos si tenemos una llave guardada
  const token = localStorage.getItem('token');

  // 2. Si hay llave, clonamos la petición y se la pegamos en la cabecera
  if (token) {
    const peticionClonada = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(peticionClonada);
  }

  // 3. Si no hay llave (ej. estamos en el login), la dejamos pasar normal
  return next(req);
};