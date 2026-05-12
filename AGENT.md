# Project Context & AI Guidelines (AGENT.md)

Este archivo sirve como memoria técnica para los agentes de IA y desarrolladores que trabajen en este proyecto. **Cualquier cambio estructural o de patrón importante debe ser registrado aquí.**

## 1. Arquitectura del Proyecto
- **Framework**: Next.js 14+ (App Router).
- **Base de Datos**: Supabase (PostgreSQL).
- **Multitenancy**: Basado en rutas dinámicas `/[tenant]`. Los datos se filtran por `tenant_id` en todas las consultas.
- **Estilos**: Tailwind CSS con un diseño personalizado "Ink & Paper" (Blanco, Negro, Slate, acentos en Honey/Amber).
- **Componentes UI**: Radix UI (vía Shadcn/UI en algunos casos) y Lucide Icons.
- **Animaciones**: Framer Motion y GSAP.

## 2. Tecnologías Clave
- **Autenticación**: Supabase Auth con perfiles vinculados en `staff_profiles`.
- **Precios y Moneda**:
  - Soporte multimoneda (USD/VES).
  - Conversión dinámica mediante `src/services/exchangeRates.js`.
  - Los productos guardan su `base_currency` (USD o VES).
- **Reportes**: Generación de PDFs en el cliente usando `@react-pdf/renderer` (ver `InvoicePDF.jsx`).
- **Realtime**: Suscripciones a cambios en la tabla `orders` para notificaciones administrativas.

## 3. Patrones de Diseño
- **Modales Premium**: Uso de `backdrop-blur-md`, bordes redondeados grandes (`rounded-3xl/4xl`), y tipografía `font-black uppercase tracking-tighter`.
- **Formularios**: Manejo de estado local con `formData`. Validaciones con SweetAlert2 (Swal).
- **API Routes**: Ubicadas en `src/app/api/`. Usan `resolveTenantContext` para asegurar el aislamiento de datos.

## 4. Estructura de Datos (Tablas Clave)
- `tenants`: Configuración global de cada tienda.
- `products`: Incluye `use_variant_only_pricing` (booleano) y `base_currency`.
- `product_variants`: Ajustes de precio y stock por variante.
- `orders`: Almacena `items` (JSONB), `total`, `estado`, `metodo_pago`, `referencia_pago`, `shipping_method`, `shipping_provider`.
- `staff_profiles`: Relación entre usuarios de Supabase Auth y tenants/roles.

## 5. Historial de Cambios Relevantes (Resumen)
- **2026-05-09**: Implementación de lógica multimoneda en Dashboard y Tabla de Productos. Corrección de persistencia de `base_currency` en la API.
- **2026-05-10**: Refactorización de `PricingStock` para inferir estado de variantes si el precio es 0.
- **2026-05-12**: (En progreso) Mejora de gestión de roles y corrección de visualización de tipo de entrega en facturas/admin.

## 6. Reglas para la IA
- **No repetir patrones**: Antes de implementar una solución, verificar si ya existe un service o componente (ej. `convertPrice`).
- **Aesthetics First**: Los diseños deben ser "Premium". Evitar colores genéricos. Usar la paleta Slate/Emerald/Amber/Rose definida.

## 7. Solución de Problemas Comunes
- **AuthApiError (Invalid Refresh Token)**: En `localhost`, Supabase puede fallar al refrescar sesiones antiguas. Se ha implementado `ensureValidSession` en `client.js` con un pequeño delay para limpiar automáticamente estos tokens inválidos sin romper la experiencia del usuario.
- **Seguridad Multitenant**: Siempre asegurar que las consultas filtren por `tenant_id`.

## 8. Patrones de UX
- **Búsqueda de Cliente Obligatoria**: En el checkout, los campos de datos personales están bloqueados hasta que el usuario realiza una búsqueda por identificación. Esto previene duplicados en la base de datos y agiliza la compra para clientes recurrentes.
