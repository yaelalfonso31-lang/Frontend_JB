import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./auth/login/login').then(m => m.LoginComponent)
    },
    {
        path: 'inicio',
        loadComponent: () => import('./pages/inicio/inicio').then(m => m.InicioComponent)
    },
    {
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
        path: 'recuperar-contra',
        loadComponent: () => import('./auth/recuperar-contra/recuperar-contra').then(m => m.RecuperarContraComponent)
    },
    {
        path: 'registro-colaborador',
        loadComponent: () => import('./auth/registro-colaborador/registro-colaborador').then(m => m.RegistroColaboradorComponent)
    },
    {
        path: 'encuesta-satisfaccion',
        loadComponent: () => import('./auth/encuesta-satisfaccion/encuesta-satisfaccion').then(m => m.EncuestaSatisfaccionComponent)
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
                loadComponent: () => import('./administrador/gestion-colaboradores/aprobacion-colaboradores').then(m => m.AprobacionColaboradoresComponent)
            },
            {
                path: 'solicitudes',
                loadComponent: () => import('./administrador/monitor-solicitudes/monitor-solicitudes').then(m => m.MonitorSolicitudesComponent)
            },
            {
                path: 'checklists',
                loadComponent: () => import('./colaborador/checklists/checklists').then(m => m.ChecklistsComponent)
            },
            {
                path: 'checklist-visita',
                loadComponent: () => import('./colaborador/checklist-visita/checklist-visita').then(m => m.ChecklistVisitaComponent)
            },
            {
                path: 'checklist-visita-taller',
                loadComponent: () => import('./colaborador/checklist-visita-taller/checklist-visita-taller').then(m => m.ChecklistVisitaTallerComponent)
            },
            {
                path: 'checklist-visita-tematica',
                loadComponent: () => import('./colaborador/checklist-visita-tematica/checklist-visita-tematica').then(m => m.ChecklistVisitaTematicaComponent)
            },
            {
                path: 'calendario',
                loadComponent: () => import('./administrador/calendario/calendario').then(m => m.AdministradorCalendarioComponent)
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
        path: 'colaborador',
        loadComponent: () => import('./colaborador/colaborador').then(m => m.ColaboradorComponent),
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./colaborador/dashboard/dashboard').then(m => m.Dashboard)
            },
            {
                path: 'solicitudes',
                loadComponent: () => import('./colaborador/monitor-solicitudes/monitor-solicitudes').then(m => m.MonitorSolicitudes)
            },
            {
                path: 'checklists',
                loadComponent: () => import('./colaborador/checklists/checklists').then(m => m.ChecklistsComponent)
            },
            {
                path: 'checklist-visita',
                loadComponent: () => import('./colaborador/checklist-visita/checklist-visita').then(m => m.ChecklistVisitaComponent)
            },
            {
                path: 'checklist-visita-taller',
                loadComponent: () => import('./colaborador/checklist-visita-taller/checklist-visita-taller').then(m => m.ChecklistVisitaTallerComponent)
            },
            {
                path: 'checklist-visita-tematica',
                loadComponent: () => import('./colaborador/checklist-visita-tematica/checklist-visita-tematica').then(m => m.ChecklistVisitaTematicaComponent)
            },
            {
                path: 'instalaciones',
                loadComponent: () => import('./colaborador/instalaciones/instalaciones').then(m => m.Instalaciones)
            },
            {
                path: 'calendario',
                loadComponent: () => import('./colaborador/calendario/calendario').then(m => m.Calendario)
            },
            {
                path: '',
                redirectTo: '/colaborador/dashboard',
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
