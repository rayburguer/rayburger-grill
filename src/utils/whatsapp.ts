import { Order, User, CartItem } from '../types';
import { WHATSAPP_NUMBER, PAGO_MOVIL_BANK, PAGO_MOVIL_ID, PAGO_MOVIL_PHONE } from '../config/constants';

export const generateWhatsAppLink = (
    order: Order,
    user: User | undefined, // Undefined if guest
    cartItems: CartItem[],
    tasaBs: number // NEW PARAMETER
): string => {
    const isGuest = !user;
    const customerName = user?.name || "Invitado";
    const customerEmail = user?.email || "Sin email";
    const totalBs = (order.totalUsd * tasaBs).toFixed(2);

    let message = `*¡Hola RayburgerGrill!* 🍔🔥\n`;
    message += `Quiero confirmar mi pedido a través de la Web.\n\n`;

    message += `🆔 *ID Orden:* ${order.orderId.substring(0, 8).toUpperCase()}\n`;
    message += `📅 *Fecha:* ${new Date(order.timestamp).toLocaleDateString()} ${new Date(order.timestamp).toLocaleTimeString()}\n\n`;

    message += `*🛒 Mi Pedido:*\n`;
    cartItems.forEach(item => {
        const subtotal = item.finalPrice_usd * item.quantity;
        message += `- ${item.quantity}x ${item.name}`;
        if (item.selectedOptions && Object.keys(item.selectedOptions).length > 0) {
            const productOptionsDescription = item.customizableOptions?.map(opt => {
                const isSelected = item.selectedOptions[opt.id];
                if (opt.defaultIncluded && !isSelected) return `SIN ${opt.name.toUpperCase()}`;
                if (!opt.defaultIncluded && isSelected) return `EXTRA ${opt.name.toUpperCase()}`;
                return null;
            }).filter(Boolean).join(', ');

            if (productOptionsDescription) message += ` _(${productOptionsDescription})_`;
        }
        message += ` → $${subtotal.toFixed(2)}\n`;
    });

    if (order.deliveryFee > 0) {
        message += `🛵 *Delivery:* $${order.deliveryFee.toFixed(2)}\n`;
    }

    if (order.balanceUsed_usd && order.balanceUsed_usd > 0) {
        message += `💰 *Billetera Ray Usada:* -$${order.balanceUsed_usd.toFixed(2)}\n`;
    }

    message += `\n💰 *TOTAL A PAGAR: $${order.totalUsd.toFixed(2)}*\n`;
    message += `\n🇻🇪 *TOTAL EN BS: ${totalBs} Bs.*\n`;
    message += `_(Tasa: ${tasaBs.toFixed(2)} Bs/$)_\n`;

    if (!isGuest && order.rewardsEarned_usd) {
        message += `\n🎁 *Recompensa en Billetera:* +$${order.rewardsEarned_usd.toFixed(2)}\n`;
    }

    message += `\n👤 *Datos del Cliente:*\n`;
    message += `Nombre: ${customerName}\n`;
    message += `WhatsApp: ${order.customerPhone || 'No prop.'}\n`;
    if (!isGuest) message += `Email: ${customerEmail}\n`;

    message += `\n📍 *Método de Entrega:*\n`;
    message += order.deliveryMethod === 'delivery' ? `🛵 Envío a Domicilio` : `🏠 Retiro en Local`;

    message += `\n\n🛰️ *Rastreo en Vivo:* Puedo ver el progreso de mi pedido en tiempo real en la Web.`;
    message += `\n💸 *DATOS PARA PAGO MÓVIL:*\n`;
    message += `🏛️ *${PAGO_MOVIL_BANK}*\n`;
    message += `🆔 *C.I:* ${PAGO_MOVIL_ID}\n`;
    message += `📱 *Teléfono:* ${PAGO_MOVIL_PHONE}\n`;
    message += `_(Enviar capture por aquí para confirmar)_`;

    // Deep link: FIXED to use current origin
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://rayburgergrill.com.ve';
    const deepLink = `${origin}?admin=orders&orderId=${order.orderId}`;
    message += `\n\n━━━━━━━━━━━━━━━━━━\n📱 *GESTIONAR PEDIDO*\n${deepLink}\n━━━━━━━━━━━━━━━━━━`;

    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
};
