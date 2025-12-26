# 👑 Manual de Dueño / Admin - Ray Burger Grill

Guía para gestionar tu negocio digital y mantener el control total.

## 1. Acceso Administrativo
- Inicia sesión con tu correo de administrador.
- Toca el botón **"Admin"**. El sistema validará tu acceso por cargo (no más contraseñas genéricas).

## 2. Dashboard Principal - Inteligencia de Negocio
Aquí verás el pulso de tu negocio en tiempo real:

### Métricas Principales
- **Total Ventas:** Dinero total procesado (con desglose Hoy/Semana/Mes).
- **Pedidos Totales:** Cantidad de órdenes.
- **Usuarios:** Número de clientes registrados (Importante para desbloquear "La Carrera").

### 🆕 Métricas de Negocio (NUEVO)
Sección con fondo naranja que muestra:
- **🏆 Producto Top:** Tu producto más vendido con cantidad de ventas
- **💰 Ticket Promedio:** Valor promedio de cada pedido (para optimizar precios)
- **👥 Tasa de Referidos:** Porcentaje de usuarios que llegaron por referidos

### Configuración
- **Tasa del Día:** ¡Muy importante! Actualiza aquí el precio del Dólar (Bs/$) diariamente para que los clientes vean precios correctos al pagar.

## 3. Gestión de Menú (Productos y Salsas)
En la pestaña "Gestión de Menú" puedes:

### Crear/Editar Productos
- **Crear Producto:** Botón "Agregar Nuevo Producto".
- **Editar:** Toca el lápiz ✏️ en cualquier producto.
    - *Tip:* Puedes cambiar precios, descripciones y fotos.
- **Salsas y Extras:** Estas categorías aparecen colapsadas en el menú principal para que la navegación sea más rápida desde el móvil. Puedes gestionarlas igual que cualquier producto.

### 🆕 Control de Inventario (NUEVO)
Cada producto ahora tiene un **toggle de disponibilidad**:
- **"🚫 Agotar"** (botón rojo): Marca el producto como no disponible
- **"✓ Activar"** (botón verde): Vuelve a activar el producto

**Efectos automáticos:**
- Los productos agotados muestran badge "🚫 AGOTADO" a los clientes
- La imagen se pone en escala de grises
- El botón de añadir al carrito se deshabilita
- El estado se guarda automáticamente

**Indicador visual:**
- ✓ Disponible (verde)
- ✗ Agotado (rojo)

## 4. Gestión de Pedidos (El flujo de dinero)
Cuando un cliente hace un pedido, llega como **"Pendiente"**.

### 🆕 Mejoras en Panel de Pedidos (NUEVO)
- **Contadores:** Cada filtro muestra cuántos pedidos hay (ej: "Pendientes (5)")
- **Búsqueda:** Busca por ID, email o nombre del cliente
- **Filtros:** Pendientes / Aprobados / Rechazados / Todos

### Proceso de Aprobación
1.  **Pedidos Web:** Verifica el pago y dale "Aprobar".
2.  **Pedidos de Caja (POS):** Llegan como **"Pendiente"** para que cocina los vea. Una vez entregado el producto al cliente en el mostrador, márcalo como **"Entregado"** en este panel.
3.  **Aprobar (✓):** Al aprobar (o marcar como entregado en POS), el sistema **le entrega los Puntos y el Saldo (Cashback)** al cliente automáticamente.
    - Los puntos pasan de "Pendientes" a "Disponibles".
4.  **Rechazar (✗):** Si el pago no llegó o hubo un error, usa el botón rojo.

---

## 5. Punto de Venta (Quick POS)
Optimizado para ventas rápidas en el local:
- **Personalización:** Al tocar un producto, puedes quitar o poner ingredientes extras. Ideal para pedidos especiales ("Sin cebolla", "Doble carne").
- **Eliminación Directa:** Si te equivocas, usa la **X roja** en el cuadro del producto para quitarlo del pedido al instante.
- **WhatsApp Instantáneo:** Al cobrar, si pones el número del cliente, se abre WhatsApp con su recibo y sus puntos de regalo.

---

## 5. La Ruleta y Premios
- La Ruleta funciona sola. No tienes que hacer nada.
- Si un cliente gana, el sistema le suma el saldo o los puntos automáticamente.
- Puedes ver en el perfil del usuario si ha ganado recientemente (su saldo habrá aumentado).

## 6. Copia de Seguridad
En el Dashboard, tienes un botón **"Backup"**.
- Úsalo una vez a la semana para descargar un archivo con toda tu base de datos (clientes, pedidos, menú).
- Si cambias de computadora, usa **"Restaurar"** con ese archivo para recuperar todo.

## 7. 💡 Tips de Gestión

### Optimiza tu Menú
- Usa las **Métricas de Negocio** para identificar tus productos estrella
- Si un producto no se vende, considera bajarlo de precio o quitarlo del menú
- El **Ticket Promedio** te ayuda a saber si tus precios son competitivos

### Gestión de Inventario
- Marca productos como agotados **antes** de que los clientes los pidan
- Reactiva productos en cuanto tengas stock nuevamente
- Evita decepcionar clientes con pedidos que no puedes cumplir

### Análisis de Referidos
- Si la **Tasa de Referidos** es baja (<10%), considera:
  - Ofrecer mejores bonos por referir
  - Recordar a los clientes que pueden referir desde su perfil
  - Promocionar el botón de WhatsApp para referir

### Gestión de Pedidos
- Aprueba pedidos rápido para que los clientes reciban sus puntos
- Usa los filtros para enfocarte en pedidos pendientes
- Rechaza solo si estás 100% seguro que no hay pago

---

## 🆕 Nuevas Features Implementadas

### Para ti (Admin):
✅ Control de inventario con toggle simple
✅ Métricas de negocio en tiempo real
✅ Contadores visuales en gestión de pedidos
✅ Mejor organización del dashboard

### Para tus clientes:
✅ Botón WhatsApp para referir amigos (1 clic)
✅ Badges de productos agotados
✅ Animaciones de confetti al añadir al carrito
✅ Carga más rápida con skeleton loaders
✅ Mejor contraste y accesibilidad

---

**Soporte Técnico:**
Si algo falla o necesitas ayuda, contacta a tu desarrollador.

**Versión:** 2.1 - Master Edition (Dic 2024). Optimizada para POS móvil y Nube Blindada.
