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

### 📦 Gestión de Inventario Inteligente (Smart Stock)

- **Visualización Proactiva**:
  - `Stock = 0`: Badge "Agotado", imagen en escala de grises y bloqueo de botones de compra.
  - `Stock < 5`: Badge pulsante "Pocas unidades" que muestra el stock restante en tiempo real.
- **Consultas de Disponibilidad**: Integración de botones de WhatsApp para productos agotados (`whatsapp_stock_check`) y enlaces de "Confirmar disponibilidad" para compras preventivas.
- **Consultas de Disponibilidad (Actualización)**:
  - La consulta por WhatsApp se centraliza antes del checkout (ficha de producto y quick add).
  - El botón de consulta desde checkout queda desactivado para evitar duplicidad de flujo.
  - La consulta se muestra siempre que exista número de WhatsApp configurado (incluyendo agotados).
- **Validación en Checkout**: El sistema valida el inventario inmediatamente antes de procesar pagos manuales, evitando la sobreventa.

### ⚡ Experiencia en Tiempo Real (Realtime & Social Proof)

- **Sincronización Live**: Suscripción a cambios en `product_stock` y `product_variants` vía Supabase Realtime para actualizar la UI sin recargas.
- **Estrategia FOMO (Presencia)**:
  - Uso de Supabase Presence para detectar cuántos usuarios están en el checkout de un producto específico.
  - Notificaciones dinámicas ("🔥 X personas están por comprar esto") para generar urgencia y transparencia.
- **Base de Datos**: Lógica adaptada para funcionar correctamente sin la columna `manage_stock`, basándose en la existencia de registros de inventario.

### 🛠️ Configuración de Servidor

- **Supabase Realtime**: Requiere que las tablas `product_stock` y `product_variants` tengan activa la publicación de cambios (Replication).
- **Checkout Action**: `processCheckoutOrder` realiza una validación final atómica antes de generar el movimiento de stock negativo.
- **Seguridad Multitenant**: Siempre asegurar que las consultas filtren por `tenant_id`.

## 5. Historial de Cambios Relevantes (Resumen)

- **2026-05-09**: Implementación de lógica multimoneda en Dashboard y Tabla de Productos. Corrección de persistencia de `base_currency` en la API.
- **2026-05-10**: Refactorización de `PricingStock` para inferir estado de variantes si el precio es 0.
- **2026-05-12**: (En progreso) Mejora de gestión de roles y corrección de visualización de tipo de entrega en facturas/admin.
- **2026-05-26**:
  - **Sidebar Admin**: Alineación consistente de items con altura fija (`h-12`) para evitar desplazamientos visuales de "Categorías" u otros items.
  - **Página de Ventas**: Reestructurada con encabezado + tabs internos (similar a Ajustes). Tabs: "Ventas Generales" (vista principal) y "Cierre del Día" (render interno sin navegación forzada).
  - **Horario del Footer**: Agregado campo opcional en página principal (`page.jsx`) para mostrar horarios de negocio en la zona baja del footer con diseño responsive. Uso de `useEffect` en cliente para evitar hydration mismatch con `new Date()`.
  - **Roles y Acceso**: Caché en memoria con TTL corto para reducir peticiones repetidas al entrar/salir de la vista.
  - **Comercio y Footer**: Autocompletado de símbolo de moneda al cambiar código (`USD -> $`, `VES -> Bs `).
  - **Identidad y Navegación**: Nuevo bloque QR para compartir tienda (URL `host + slug`), copiar enlace y descargar PNG con logo centrado.
  - **Cierre Diario PDF**: Corregido el flujo PDF en frontend; Excel sigue por API (`/api/admin/export/orders`).
  - **Sidebar Admin (Ajuste Fino)**: Compactación leve aplicada solo en desktop con poca altura (umbral `max-height: 760px` y `min-width: lg`), reduciendo iconos/paddings/espaciado sin afectar mobile.
  - **Comercio y Legal (Horario)**: El bloque "Horario de laburo" ahora usa layout adaptativo por fila: en pantallas pequeñas se divide en 2 niveles (día+switch y horas), y en desktop conserva 4 columnas.
  - **Compartir Producto (Frontend Público)**: Implementado flujo real de compartir en `ProductCard`, `ProductView` y `QuickAddSheet` con prioridad `navigator.share`, fallback a portapapeles y fallback final a WhatsApp.

## 6. Reglas para la IA

- **No repetir patrones**: Antes de implementar una solución, verificar si ya existe un service o componente (ej. `convertPrice`).
- **Aesthetics First**: Los diseños deben ser "Premium". Evitar colores genéricos. Usar la paleta Slate/Emerald/Amber/Rose definida.

## 7. Solución de Problemas Comunes

- **AuthApiError (Invalid Refresh Token)**: En `localhost`, Supabase puede fallar al refrescar sesiones antiguas. Se ha implementado `ensureValidSession` en `client.js` con un pequeño delay para limpiar automáticamente estos tokens inválidos sin romper la experiencia del usuario.
- **Seguridad Multitenant**: Siempre asegurar que las consultas filtren por `tenant_id`.

## 8. Patrones de UX

- **Búsqueda de Cliente Obligatoria**: En el checkout, los campos de datos personales están bloqueados hasta que el usuario realiza una búsqueda por identificación. Esto previene duplicados en la base de datos y agiliza la compra para clientes recurrentes.

## 9. Productos Públicos (Carrusel, Variantes y Categorías)

- **Carrusel Home (`ProductCarouselSection`)**:
  - El slider/autoscroll solo debe activarse cuando hay overflow real del track.
  - Si no hay overflow, no duplicar ítems ni forzar animación.
  - Al abrir/cerrar `QuickAddSheet`, resetear estados `hover/touch/drag` para que el carrusel retome automáticamente (especialmente en mobile).
  - Evitar `dragstart` nativo en imágenes/contenedor para no mostrar ghost image al arrastrar.
  - Mantener sombreado lateral suave en X para dar contexto de continuidad.

- **Card pública (`ProductCard`)**:
  - El botón superior derecho de compartir está activo y comparte `nombre + link` del producto.
  - Flujo técnico: `navigator.share` -> copiar enlace -> fallback WhatsApp.
  - Las etiquetas de categoría deben reservar espacio para ese botón (`right-*`) y no renderizarse debajo del icono.
  - En mobile: mostrar una categoría principal y contador `+n` para reducir ruido visual.

- **Productos completos `/[tenant]/products`**:
  - Enviar/renderizar solo categorías activas (categorías que realmente están vinculadas a productos del tenant).
  - No mostrar categorías vacías para evitar ruido de UX y carga innecesaria de data en filtros.

- **Disponibilidad por variantes (Quick Add + Product View)**:
  - La disponibilidad de opciones debe evaluarse con `variant.stock_quantity` (fallback `stock_adjustment`).
  - Una opción de atributo se considera seleccionable solo si existe al menos una combinación compatible con stock > 0.
  - Botones de compra deben bloquearse si la variante seleccionada no tiene stock.
  - Mensajes de validación deben indicar claramente "sin stock" para la combinación seleccionada.
  - Esto resuelve casos tipo: producto con variantes `SLIM` y `PRO`, donde solo una tiene inventario.

- **Nota de arquitectura de stock**:
  - El stock global (`product_stock`) puede ser suma agregada y no reemplaza la validación por variante.
  - Para decisiones por combinación en frontend, la fuente de verdad es `product_variants.stock_quantity`.

## 10. Admin Layout (Low Height)

- La compactación del sidebar por altura aplica solo en desktop (`min-width: 1024px`) y cuando el viewport tiene `max-height: 760px`.
- Mobile mantiene su comportamiento y tamaño visual original.
- Ajuste aplicado: reducción leve de iconos/paddings/espaciados para evitar roturas en laptops de poca altura.
