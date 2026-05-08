# 📘 Manual de Usuario — Panel Administrativo de Tienda

**Plataforma E-Commerce Multitenant**
*Versión 1.0 — Mayo 2026*

---

## Tabla de Contenido

1. Introducción
2. Acceso al Panel
3. Panel Principal (Dashboard)
4. Gestión de Productos
5. Gestión de Categorías
6. Gestión de Ventas (Órdenes)
7. Gestión de Clientes
8. Bitácora (Historial de Actividad)
9. Ajustes del Sistema
10. Preguntas Frecuentes

---

## 1. Introducción

Bienvenido al panel administrativo de tu tienda online. Desde aquí podrás gestionar todo el contenido que verán tus clientes: productos, categorías, órdenes, configuración visual de la tienda, métodos de pago, logística y más.

### ¿Quién debe usar este manual?

Este manual está dirigido al administrador de la tienda (tenant), es decir, el usuario encargado de:

- Cargar y mantener el catálogo de productos
- Gestionar las órdenes de compra
- Personalizar la apariencia de la tienda pública
- Administrar usuarios del equipo (staff)
- Configurar métodos de pago y envío

### Navegación del Panel

El panel cuenta con una barra lateral (sidebar) con los siguientes módulos:

- 🏠 Panel — Dashboard con resumen general
- 🛍️ Productos — Catálogo, precios, stock, variantes
- 🏷️ Categorías — Nicho de tienda y organización
- 📊 Ventas — Órdenes, estados y exportación
- 👥 Clientes — Base de datos de compradores
- 📋 Bitácora — Registro de todas las acciones
- ⚙️ Ajustes — Configuración web, roles y comercio

💡 La barra lateral se puede colapsar haciendo clic en la flecha ubicada al borde derecho del sidebar. En dispositivos móviles, se abre con el menú hamburguesa.

---

## 2. Acceso al Panel

### 2.1 Iniciar Sesión

1. Navega a la ruta /access de tu dominio
2. Ingresa tu correo electrónico y contraseña
3. Haz clic en "Entrar al Sistema"

⚠️ Solo los usuarios registrados como staff pueden acceder al panel. Si recibes el error "Acceso Denegado", contacta al super administrador.

### 2.2 Cerrar Sesión

Haz clic en el botón "Salir" (rojo) ubicado en la parte inferior de la barra lateral.

---

## 3. Panel Principal (Dashboard)

Al iniciar sesión serás dirigido al Resumen General. Aquí encontrarás:

### 3.1 Métricas Principales

Se muestran tres tarjetas con información en tiempo real:

- Ventas Hoy: Total en USD de las órdenes con estado "paid" creadas hoy.
- Órdenes Históricas: Cantidad total de órdenes registradas.
- Stock Bajo: Cantidad de productos con stock ≤ 5 unidades.

### 3.2 Órdenes Recientes

Tabla con las últimas 5 órdenes mostrando:
- Número de orden
- Nombre del cliente
- Total en USD
- Estado (Pendiente / Completado / Cancelado)

### 3.3 Accesos Rápidos

Botones directos a:
- Productos → Gestionar stock y precios
- Categorías → Organizar el catálogo
- Ventas → Historial de pedidos

---

## 4. Gestión de Productos

Ruta: /admin/products

### 4.1 Listado de Productos

Al entrar verás una tabla con todos tus productos mostrando:
- Nombre e imagen
- Precio
- Stock disponible
- Estado (Publicado / Borrador)
- Categorías asignadas

Funciones de la tabla:
- 🔍 Buscar: Filtra productos por nombre
- 📋 Filtro de estado: Publicados, Borradores, Stock bajo, Todos
- ☑️ Selección múltiple: Marca varios productos para acciones masivas
- 📄 Paginación: Navega entre páginas (5, 10 o 20 por página)

### 4.2 Crear un Producto

1. Haz clic en "+ Nuevo Producto"
2. Se abrirá un formulario modal con las siguientes secciones:

**Información Principal:**
- Nombre (obligatorio): Nombre del producto
- Descripción corta: Texto breve para la tarjeta del producto
- Descripción completa: Detalle extenso del producto
- Slug: Se genera automáticamente del nombre (se usa en la URL)

**Precio y Stock:**
- Precio base (obligatorio): Precio en la moneda configurada
- Precio con descuento: Si aplica, precio rebajado
- Stock: Cantidad disponible
- Gestión de stock: Toggle para activar/desactivar control de inventario. Si se desactiva, el stock se marca como "Ilimitado" (ideal para servicios o restaurantes)

**Media y Estado:**
- Imágenes: Sube hasta 5 imágenes por producto (se almacenan en Cloudinary)
- Categorías (obligatorio): Selecciona una o más categorías
- Estado: "Publicado" (visible al cliente) o "Borrador" (oculto)
- Destacado: Marca el producto como favorito

**Variantes:**
- Agrega variantes como Talla, Color, etc.
- Cada variante puede tener su propio ajuste de precio y stock individual
- El stock total se calcula automáticamente sumando las variantes

3. Haz clic en "Crear Producto" para guardar

📌 Nota: Si el producto tiene variantes, el campo de stock general se calcula automáticamente y no se puede editar manualmente.

### 4.3 Editar un Producto

- Haz clic en el ícono de edición (lápiz) en la fila del producto
- Modifica los campos necesarios
- Haz clic en "Actualizar Producto"

### 4.4 Ver Detalles (Solo Lectura)

- Haz clic en el ícono de ojo para ver los detalles sin posibilidad de edición

### 4.5 Eliminar Producto

- Haz clic en el ícono de papelera
- Confirma la acción en el diálogo de confirmación

🚨 La eliminación es permanente e irreversible. Se borran también las variantes e imágenes asociadas.

### 4.6 Acciones Masivas

Cuando seleccionas múltiples productos aparece una barra con:
- Publicar seleccionados: Cambia el estado a "published"
- Pasar a borrador: Cambia el estado a "draft"
- Eliminar seleccionados: Elimina todos los marcados

### 4.7 Exportar Productos

Usa los botones de exportación para generar reportes en:
- PDF: Se abre la vista de impresión del navegador
- CSV / Excel: Descarga un archivo con los datos filtrados

---

## 5. Gestión de Categorías

Ruta: /admin/categories

### 5.1 Elegir Nicho de Tienda

Antes de ver categorías, debes seleccionar el tipo de tienda (nicho):

- Tienda de Ropa: Moda, accesorios, calzado
- Tecnología: Gadgets, hardware, electrónica
- Restaurante / Comida: Menús, platos, combos
- Floristería: Arreglos florales, plantas
- Salud: Productos médicos, bienestar

Pasos:
1. Haz clic en "Elegir Nicho" o "Cambiar Nicho"
2. Selecciona tu tipo de negocio en el modal
3. Se cargarán las categorías predeterminadas del sistema (etiquetadas como "Oficial")

### 5.2 Categorías Oficiales vs Custom

- Oficial: Predefinidas por la plataforma según el nicho
- Custom: Creadas manualmente por ti

### 5.3 Crear Categoría Personalizada

1. Haz clic en "+ Agregar Categoría"
2. Escribe el nombre de la categoría
3. El slug se genera automáticamente
4. Haz clic en "Guardar Categoría"

⚠️ Las categorías NO se pueden editar después de crearlas. Verifica el nombre antes de guardar.

### 5.4 Subcategorías

Las categorías pueden tener subcategorías anidadas. Haz clic en la flecha expansora (▶) para ver las subcategorías de cada categoría padre.

---

## 6. Gestión de Ventas (Órdenes)

Ruta: /admin/orders

### 6.1 Listado de Órdenes

Tabla con todas las órdenes mostrando:
- Número de orden (ej: #00042)
- Nombre del cliente
- Fecha de creación
- Total en USD
- Estado actual
- Método de pago

### 6.2 Filtros Disponibles

- Búsqueda: Por ID de orden o nombre de cliente
- Estado: Todos, Pendiente, Pagado, Cancelado
- Moneda: Cambiar la visualización de montos (USD / VES)
- Filtros avanzados: Rango de fechas, monto mínimo/máximo, método de pago, método de envío, proveedor de envío

### 6.3 Gestionar Estado de una Orden

Puedes cambiar el estado de cada orden:

- pending (Pendiente): El cliente realizó el pedido, pendiente de verificar pago
- paid (Completado): Pago verificado y confirmado
- cancelled (Cancelado): Orden rechazada o cancelada

**Aprobar una orden:**
- Haz clic en el botón de aprobar (✓) para marcar como "paid"

**Rechazar una orden:**
1. Haz clic en el botón de rechazar (✕)
2. Selecciona un motivo:
   - Referencia de pago inválida o no coincide
   - Monto incompleto
   - Otro (especificar)
3. Confirma la acción

### 6.4 Ver Detalles de Orden

Haz clic en una orden para abrir el modal de detalles con:
- Datos completos del cliente (nombre, cédula, teléfono)
- Lista de productos comprados con cantidades
- Desglose de montos
- Comprobante de pago (si aplica)
- Método de envío seleccionado

### 6.5 Exportar Ventas

- PDF: Genera un reporte imprimible
- CSV / Excel: Descarga archivo con los datos filtrados

---

## 7. Gestión de Clientes

Ruta: /admin/customers

### 7.1 Base de Datos

Los clientes se generan automáticamente a partir de las órdenes. No necesitas crearlos manualmente.

Cada registro muestra:
- Nombre completo
- Identificación (cédula)
- Teléfono y email
- Cantidad de compras pagadas
- Total gastado en USD
- Items totales comprados

### 7.2 Filtros y Ordenamiento

- Búsqueda: Por nombre o cédula
- Ordenar por: Mayor gasto, Más compras, Más items, Alfabético
- Filtros avanzados: Mínimo de órdenes pagadas, gasto mínimo en USD, mínimo de items, solo con compras

### 7.3 Contactar Cliente

Haz clic en el ícono de WhatsApp para abrir una conversación directa con el cliente.

### 7.4 Ver Detalle del Cliente

Haz clic en un cliente para ver:
- Historial completo de órdenes
- Desglose de cada compra
- Conversión de moneda (USD ↔ VES)

### 7.5 Exportar Clientes

Disponible en PDF, CSV y Excel.

---

## 8. Bitácora (Historial de Actividad)

Ruta: /admin/history

### 8.1 ¿Qué es la Bitácora?

Es un registro automático de todas las acciones realizadas en el panel por cualquier usuario del equipo. Se actualiza en tiempo real.

### 8.2 Estadísticas Rápidas

Se muestran 4 tarjetas:
- 📋 Total registros: Acciones totales registradas
- 📅 Hoy: Acciones del día actual
- 💳 Ventas registradas: Eventos de tipo venta
- 👤 Eventos de usuario: Acciones relacionadas con usuarios

### 8.3 Filtros

- Búsqueda: Por descripción o nombre de usuario
- Tipo: Todos, Venta, Usuario, Ajuste, etc.
- Acción: Todas, Crear, Editar, Eliminar, etc.

📌 La bitácora se actualiza automáticamente cuando otro usuario del equipo realiza una acción, sin necesidad de recargar la página.

---

## 9. Ajustes del Sistema

Ruta: /admin/settings

Los ajustes se dividen en dos pestañas principales:

---

### PESTAÑA 1: Configuración Web

Contiene tres sub-secciones organizadas por tabs:

#### 9.1 Identidad y Navegación

**Identidad Visual:**
- Nombre de la tienda: El nombre que aparece en el header y SEO
- URL (Slug): Se genera automáticamente del nombre. Define la ruta pública de tu tienda
- Logo: Sube el logo de tu tienda (se almacena en Cloudinary)

⚠️ Solo puedes cambiar el nombre/slug 3 veces cada 30 días. Los cambios de URL hacen que los enlaces anteriores dejen de funcionar.

**Menú de Navegación:**
- Configura los enlaces del menú principal que ven tus clientes
- Cada slot del menú tiene: Texto visible, URL de destino y Visibilidad

Haz clic en "Guardar Identidad" para aplicar los cambios.

#### 9.2 Contenido y Home

**Hero Slider:**
- Configura hasta 3 slides para el banner principal de tu tienda
- Cada slide tiene: Subtítulo, Título, Descripción e Imagen de fondo
- Puedes agregar, editar y eliminar slides (mínimo 1 slide obligatorio)

**Contenido Editorial:**
- Introducción del Home: Título y descripción de la sección de bienvenida
- Introducción de Productos: Texto de la sección de productos destacados

**Promo Divider:**
- Sección visual de promoción entre contenido del home
- Configura: Título, Subtítulo, Botón CTA e Imagen de fondo

Haz clic en "Guardar Contenido" para aplicar.

#### 9.3 Footer y Comercio

**WhatsApp de ventas:**
- Número de contacto para el botón de WhatsApp (formato: 584245555555)
- Opción de consulta de stock por WhatsApp antes de pagar

**Logística y Envío:**

1. Delivery Local (Moto / Propio):
   - Entregas cortas en tu zona con costo fijo
   - Configura: Costo del delivery y mínimo para delivery gratis

2. Envíos Nacionales (Agencias):
   - Envíos por MRW, Zoom, Tealca, etc.
   - Tipos de cobro: Cobro en Destino (C.O.D), Precio Fijo (Prepago), Envío Gratis
   - Si es precio fijo, configura el monto del envío

3. Retiro en Tienda (Pickup):
   - El cliente busca el pedido en tu local físico

4. Empresas de envío:
   - Activa/desactiva los proveedores disponibles (MRW, Zoom)

**Moneda y símbolo:**
- Selecciona la moneda base: USD ($) o VES (Bolívares)
- Define el símbolo a mostrar

**Métodos de pago:**
- Activa los métodos que aceptas (Pago Móvil, Zelle, PayPal, Binance, etc.)
- Al activar un método, se despliega un formulario para configurar sus datos específicos (banco, número de cuenta, titular, email, etc.)

**Avisos en productos:**
- Hasta 3 avisos informativos que aparecen en el detalle de cada producto (envíos, delivery, cambios, etc.)

**Textos legales:**
- Título y contenido de la Política de Privacidad
- Título y contenido de los Términos y Condiciones

**Footer:**
- Configura la información que aparece en el pie de página de la tienda

Haz clic en "Guardar Comercio" para aplicar.

---

### PESTAÑA 2: Roles y Permisos

Gestión del equipo de trabajo de tu tienda.

#### 9.4 Crear un Usuario de Staff

1. Haz clic en "+ Crear Usuario"
2. Completa los campos:
   - Nombre completo
   - Correo electrónico (será el login)
   - Contraseña (mínimo 6 caracteres)
   - Rol administrativo

#### 9.5 Roles Disponibles

- Super Admin: Acceso total a todos los módulos (Panel, Productos, Categorías, Ventas, Clientes, Bitácora, Ajustes)
- Editor: Panel, Productos, Categorías, Ventas
- Viewer: Panel, Ventas (solo lectura)
- Personalizado: Selección manual de módulos

#### 9.6 Módulos de Permisos

Los módulos que puedes asignar son: Panel, Productos, Categorías, Ventas, Clientes, Bitácora, Ajustes.

#### 9.7 Acciones sobre Usuarios

- ✏️ Editar: Cambiar rol, correo y permisos
- 🔑 Reiniciar Clave: Asignar nueva contraseña
- 🗑️ Eliminar: Revocar acceso permanentemente

🚨 No puedes eliminar tu propia cuenta mientras estás logueado por razones de seguridad.

---

## 10. Preguntas Frecuentes

**¿Cómo veo mi tienda pública?**
Navega a la URL de tu tenant: tudominio.com/tu-slug

**¿Puedo tener múltiples usuarios administrando la tienda?**
Sí. Desde Ajustes → Roles y Permisos puedes crear tantos usuarios como necesites, cada uno con permisos específicos.

**¿Qué pasa si un producto se queda sin stock?**
El sistema mostrará una alerta en el dashboard cuando un producto tenga 5 unidades o menos. Si el stock llega a 0, el producto seguirá visible pero no se podrá comprar.

**¿Puedo desactivar el control de stock?**
Sí. Al crear o editar un producto, desactiva el toggle "Gestión de stock". El producto se marcará como stock ilimitado (ideal para restaurantes o servicios).

**¿Las imágenes tienen límite?**
Cada producto permite un máximo de 5 imágenes. Se almacenan automáticamente en Cloudinary con optimización.

**¿Cómo cambio la moneda de la tienda?**
Ve a Ajustes → Configuración Web → Footer y Comercio y modifica la sección de moneda.

**¿Puedo exportar mis datos?**
Sí. Las secciones de Productos, Ventas y Clientes permiten exportar en PDF, CSV y Excel.

**¿Se registran todas las acciones?**
Sí. Cada acción (crear, editar, eliminar, cambios de estado) se registra automáticamente en la Bitácora con fecha, usuario y descripción.

---

💡 Consejo final: Mantén tu catálogo actualizado, verifica el stock frecuentemente desde el dashboard y revisa la bitácora periódicamente para controlar la actividad de tu equipo.

---

Manual generado a partir del código fuente del sistema.
© 2026 — Plataforma E-Commerce Multitenant
