# 🍔 Ray Burger Grill - Manual de Administración

Este documento describe cómo operar el sistema administrativo de Ray Burger Grill v2.17.

## 🔑 1. Acceso al Panel
Para ingresar al panel de control:
1.  En la página principal, haz clic en el botón **"Admin"** (ubicado en el encabezado en PC, o menú en móvil).
2.  Ingresa la **Contraseña Maestra**: `raimundo27811341`.
3.  Haz clic en "Entrar".

---

## 💵 2. Gestión de Tasa del Dólar
Para que el Checkout muestre el precio correcto en Bolívares:
1.  Dentro del Admin Panel, verás la pestaña **"Inteligencia"** (Estadísticas).
2.  Busca el campo **"Tasa BCV"** e ingresa el valor (ej. `60.5`).
3.  Haz clic en "Actualizar Tasa".

---

## 📦 3. Gestión de Pedidos (Flujo de Seguimiento)
Vete a la pestaña **"Pedidos"**:
*   **Pendientes:** Nuevos pedidos que debes revisar.
    *   👨‍🍳 **A Cocina:** Mueve el pedido a preparación. El cliente verá la barra de progreso en "Cocina".
    *   ❌ **Rechazar:** Elimina el pedido si hay algún error.
*   **En Cocina:** Pedidos en producción.
    *   🛵 **Despachar:** Indica que el pedido salió con el delivery. El cliente verá "En Camino".
*   **En Camino:** 
    *   ✅ **Entregado:** Marca como finalizado. **SÓLO en este momento se cargan los puntos al cliente y al referidor.**
*   **Entregados/Rechazados:** Historial completo.

---

## 👥 4. Gestión de Clientes (Modo POS / Tablet)
Usa la pestaña **"Clientes"** para operar en el local:
1.  **Registro Manual:** Si un cliente llega al local o pide por WhatsApp, puedes inscribirlo tú mismo.
2.  Ingresa su **Teléfono** y **Nombre**.
3.  Al darle a "Registrar", el sistema le crea su cuenta con una **clave temporal (1234)** y le regala automáticamente sus **50 puntos de bienvenida**.
4.  **Lista de Clientes:** Puedes ver cuántos puntos tiene cada persona si te preguntan en caja.

---

## 🍔 5. Gestión de Menú
Vete a la pestaña **"Productos"** (Icono de Bolsa):
*   **Crear:** Usa el botón flotante `+` para agregar un nuevo plato.
    *   *Categoría:* Asegúrate de escribirla exactamente igual a las existentes (Hamburguesas, Perros, Extras, Salsas, Combos) para que aparezca en su sección.
*   **Editar:** Haz clic en el lápiz azul de cualquier producto para cambiar precio, foto o descripción.
*   **Foto:** Puedes pegar un link de imagen o subir una foto desde tu dispositivo.

---

## 🎁 6. Lealtad y Ruleta
El sistema es automático:
*   **Puntos:** El cliente gana puntos al marcarse su orden como "Entregado".
*   **Referidos:** Si alguien compró con link de referido, el "padrino" gana 2% de cashback al marcarse la orden como "Entregado".
*   **Ruleta:** Todo cliente registrado tiene un giro gratis semanal.

---

## 📢 7. Plantillas de Mensaje Sugeridas (Copia y Pesa)
Usa estos mensajes para educar a tus clientes y que usen más la app:

### Para un cliente nuevo (Registro POS):
> "¡Hola! Ya te registré en nuestra zona VIP de Ray Burger. Tienes **50 puntos ($0.50)** de regalo para tu próxima compra. Entra aquí con tu teléfono y la clave `1234`: rayburgergrill.com.ve"

### Al recibir un pedido:
> "¡Pedido recibido! Ya lo pasé a la cocina. Puedes ver el progreso (si ya salió o si está listo) entrando a la web: rayburgergrill.com.ve"

### Para fomentar referidos:
> "¡Recuerda que si compartes tu link personal que está en tu perfil, ganas el **2% de por vida** de todo lo que tus amigos compren! Es dinero real que se suma a tu cuenta."

---

## 🆘 Soporte Técnico
Si necesitas cambiar la contraseña o ajustar reglas de negocio profundas, contacta a soporte técnico.
