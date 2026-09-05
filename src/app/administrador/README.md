# Módulo de Administrador

Este módulo contiene todas las vistas y componentes necesarios para que los administradores del jardín infantil gestionen el sistema.

## Estructura de Carpetas

```
administrador/
├── dashboard/                    # Panel de control principal
├── gestion-colaboradores/        # Gestión de personal
│   ├── lista-colaboradores/      # Lista de colaboradores activos e inactivos
│   └── aprobacion-colaboradores/ # Aprobación de nuevas solicitudes
├── monitor-solicitudes/          # Monitor global de solicitudes
├── configuracion-sistema/        # Configuración general del sistema
├── administrador.ts              # Componente contenedor
├── administrador.html
└── administrador.scss
```

## Componentes Disponibles

### 1. Dashboard (Panel de Control)
**Ruta:** `/administrador/dashboard`

Muestra un resumen rápido del estado del sistema con las siguientes métricas:
- Total de solicitudes del mes
- Solicitudes aprobadas
- Solicitudes pendientes
- Número de colaboradores activos

**Archivos:**
- `dashboard.ts` - Lógica del componente
- `dashboard.html` - Plantilla
- `dashboard.scss` - Estilos
- `dashboard.spec.ts` - Tests unitarios

### 2. Gestión de Colaboradores - Lista
**Ruta:** `/administrador/colaboradores`

Tabla completa de todos los colaboradores del jardín (activos e inactivos).

**Características:**
- Búsqueda por nombre, email o cargo
- Filtrado por estado (activos/inactivos)
- Edición de colaboradores
- Activar/desactivar colaboradores
- Eliminar colaboradores

**Archivos:**
- `lista-colaboradores.ts`
- `lista-colaboradores.html`
- `lista-colaboradores.scss`
- `lista-colaboradores.spec.ts`

### 3. Gestión de Colaboradores - Aprobación
**Ruta:** `/administrador/aprobacion`

Sección dedicada a revisar y aprobar/rechazar nuevas solicitudes de colaboradores.

**Características:**
- Visualización de solicitudes pendientes
- Vista detallada de cada solicitud
- Botones para aprobar o rechazar
- Seguimiento de solicitudes aprobadas y rechazadas

**Archivos:**
- `aprobacion-colaboradores.ts`
- `aprobacion-colaboradores.html`
- `aprobacion-colaboradores.scss`
- `aprobacion-colaboradores.spec.ts`

### 4. Monitor Global de Solicitudes
**Ruta:** `/administrador/solicitudes`

Tabla maestra con todas las solicitudes de visita del jardín.

**Características:**
- Tabla con todas las solicitudes
- Filtros por:
  - Fecha de visita
  - Estado (aprobada/pendiente/rechazada)
  - Escuela
- Exportación de datos:
  - PDF
  - Excel
  - CSV
- Estadísticas rápidas

**Archivos:**
- `monitor-solicitudes.ts`
- `monitor-solicitudes.html`
- `monitor-solicitudes.scss`
- `monitor-solicitudes.spec.ts`

### 5. Configuración del Sistema
**Ruta:** `/administrador/configuracion`

Vista para definir parámetros generales del sistema.

**Características:**
- Establecer límite máximo de visitantes por día
- Bloqueo de fechas (días festivos o mantenimiento)
- Agregar/eliminar días festivos
- Información del sistema

**Archivos:**
- `configuracion-sistema.ts`
- `configuracion-sistema.html`
- `configuracion-sistema.scss`
- `configuracion-sistema.spec.ts`

## Enrutamiento

El módulo utiliza lazy loading para optimizar la carga:

```typescript
{
    path: 'administrador',
    loadComponent: () => import('./administrador/administrador').then(m => m.AdministradorComponent),
    children: [
        {
            path: 'dashboard',
            loadComponent: () => import('./administrador/dashboard/dashboard').then(m => m.DashboardComponent)
        },
        // ... más rutas
    ]
}
```

## Navegación

La navegación se realiza a través de la barra lateral del componente `AdministradorComponent`, que proporciona acceso rápido a todas las secciones.

## Estilos

Todos los componentes siguen un esquema de colores consistente:
- **Primario:** #007bff (Azul)
- **Éxito:** #28a745 (Verde)
- **Advertencia:** #ffc107 (Amarillo)
- **Peligro:** #dc3545 (Rojo)
- **Información:** #17a2b8 (Cyan)

## Componentes Standalone

Todos los componentes del módulo son componentes standalone de Angular, lo que permite:
- Importación directa de dependencias
- Mejor tree-shaking
- Mejor rendimiento
- Sintaxis moderna de Angular

## Testing

Cada componente incluye un archivo `.spec.ts` con tests unitarios básicos. Para ejecutar los tests:

```bash
npm test
```

## Próximos Pasos

Para integrar completamente el módulo:

1. **Servicios:** Crear servicios para comunicación con la API backend
2. **Autenticación:** Implementar guards de ruta para proteger el acceso
3. **Datos Reales:** Conectar los componentes con datos dinámicos
4. **Validaciones:** Mejorar las validaciones de formularios
5. **Notificaciones:** Implementar alertas de éxito/error
6. **Responsividad:** Ajustar estilos para dispositivos móviles
