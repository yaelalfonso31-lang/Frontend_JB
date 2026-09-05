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
        path: 'consultar-solicitud',
        loadComponent: () => import('./reservas/consultar-solicitud/consultar-solicitud').then(m => m.ConsultarSolicitudComponent)
    },
    {
        path: 'programa-servicio',
        loadComponent: () => import('./reservas/Programa-servicio/Programa-servicio').then(m => m.ProgramaServicioComponent)
    },
    {
        path: 'administrador',
        loadComponent: () => import('./administrador/administrador').then(m => m.AdministradorComponent),
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./administrador/dashboard/dashboard').then(m => m.DashboardComponent)
            },
            {
                path: 'colaboradores',
                loadComponent: () => import('./administrador/gestion-colaboradores/lista-colaboradores/lista-colaboradores').then(m => m.ListaColaboradoresComponent)
            },
            {
                path: 'aprobacion',
                loadComponent: () => import('./administrador/gestion-colaboradores/aprobacion-colaboradores/aprobacion-colaboradores').then(m => m.AprobacionColaboradoresComponent)
            },
            {
                path: 'solicitudes',
                loadComponent: () => import('./administrador/monitor-solicitudes/monitor-solicitudes').then(m => m.MonitorSolicitudesComponent)
            },
            {
                path: 'configuracion',
                loadComponent: () => import('./administrador/configuracion-sistema/configuracion-sistema').then(m => m.ConfiguracionSistemaComponent)
            },
            {
                path: '',
                redirectTo: '/administrador/dashboard',
                pathMatch: 'full'
            }
        ]
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
