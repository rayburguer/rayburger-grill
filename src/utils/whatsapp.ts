import { Order, User, CartItem } from '../types';
import { WHATSAPP_NUMBER } from '../config/constants';

export const generateWhatsAppLink = (
    order: Order,
    user: User | undefined, // Undefined if guest
    cartItems: CartItem[]
): string => {
    const isGuest = !user;
    const customerName = user?.name || "Invitado";
    const customerEmail = user?.email || "Sin email";

    let message = `*¡Hola RayburgerGrill!* 🍔🔥\n`;
    message += `Quiero confirmar mi pedido a través de la Web.\n\n`;

    message += `🆔 *ID Orden:* ${order.orderId.substring(0, 8).toUpperCase()}\n`;
    message += `📅 *Fecha:* ${new Date(order.timestamp).toLocaleDateString()} ${new Date(order.timestamp).toLocaleTimeString()}\n\n`;

    message += `*🛒 Mi Pedido:*\n`;
    cartItems.forEach(item => {
        const subtotal = item.finalPrice_usd * item.quantity;
        message += `- ${item.quantity}x ${item.name}`;
        if (item.selectedOptions && Object.keys(item.selectedOptions).length > 0) {
            const options = Object.entries(item.selectedOptions)
                .filter(([_, enabled]) => enabled)
                .map(([id]) => id)
                .join(', ');
            if (options) message += ` _(${options})_`;
        }
        message += ` → $${subtotal.toFixed(2)}\n`;
    });

    if (order.deliveryFee > 0) {
        message += `🛵 *Delivery:* $${order.deliveryFee.toFixed(2)}\n`;
    }

    message += `\n💰 *TOTAL A PAGAR: $${order.totalUsd.toFixed(2)}*\n`;

    if (!isGuest) {
        message += `🎁 *Puntos Ganados:* +${order.pointsEarned}\n`;
        // We could check if cashback was used here if we implemented that logic fully in the order object
        // For now, simple redundancy
    }

    message += `\n👤 *Datos del Cliente:*\n`;
    message += `Nombre: ${customerName}\n`;
    message += `WhatsApp: ${order.customerPhone || 'No prop.'}\n`;
    if (!isGuest) message += `Email: ${customerEmail}\n`;

    message += `\n📍 *Método de Entrega:*\n`;
    message += order.deliveryMethod === 'delivery' ? `🛵 Envío a Domicilio` : `🏠 Retiro en Local`;

    message += `\n\n🛰️ *Rastreo en Vivo:* Puedo ver el progreso de mi pedido en tiempo real en la Web (Cocina -> Camino -> Entregado).`;
    message += `\n\n*(Por favor indícame los pasos para el pago)*`;

    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
};
