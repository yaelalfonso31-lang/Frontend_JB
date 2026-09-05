import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./auth/login/login').then(m => m.LoginComponent)
    },
    {
        // Nuestra nueva Landing Page
        path: 'inicio',
        loadComponent: () => import('./pages/inicio/inicio').then(m => m.InicioComponent)
    },
    {
        // Esta es la ruta que declaramos en el botón "Llenar Solicitud de Visita" del Login
        path: 'solicitud-visita',
        loadComponent: () => import('./reservas/solicitud-wizard/solicitud-wizard').then(m => m.SolicitudWizardComponent)
    },
    {
        path: 'programa-servicio',
        loadComponent: () => import('./reservas/Programa-servicio/Programa-servicio').then(m => m.ProgramaServicioComponent)
    },
    {
        path: '',
        redirectTo: '/login',
        pathMatch: 'full'
    },
    {
        // Ruta comodín para capturar URLs no válidas y mandarlas al login
        path: '**',
        redirectTo: '/login'
    }
];
