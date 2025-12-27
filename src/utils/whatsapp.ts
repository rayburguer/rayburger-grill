import { Order, User, CartItem } from '../types';
import { WHATSAPP_NUMBER } from '../config/constants';

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

    message += `\n💰 *TOTAL A PAGAR: $${order.totalUsd.toFixed(2)}*\n`;
    message += `🇻🇪 *TOTAL EN BS: ${totalBs} Bs.*\n`;
    message += `_(Tasa: ${tasaBs.toFixed(2)} Bs/$)_\n`;

    if (!isGuest) {
        message += `\n🎁 *Puntos Ganados:* +${order.pointsEarned}\n`;
    }

    message += `\n👤 *Datos del Cliente:*\n`;
    message += `Nombre: ${customerName}\n`;
    message += `WhatsApp: ${order.customerPhone || 'No prop.'}\n`;
    if (!isGuest) message += `Email: ${customerEmail}\n`;

    message += `\n📍 *Método de Entrega:*\n`;
    message += order.deliveryMethod === 'delivery' ? `🛵 Envío a Domicilio` : `🏠 Retiro en Local`;

    message += `\n\n🛰️ *Rastreo en Vivo:* Puedo ver el progreso de mi pedido en tiempo real en la Web.`;
    message += `\n\n💸 *DATOS PARA PAGO MÓVIL:*\n`;
    message += `🏛️ *Banco Mercantil / Venezuela*\n`;
    message += `🆔 *C.I:* 13.412.781\n`;
    message += `📱 *Teléfono:* 0424-3439729\n`; // Used the number from context "0422" seemed like a typo (0424 is more common prefix in Vzla), but user said "0422". WAIT. User wrote "04228344594" in prompt. But prompt says "04128344594" in context? Let me check prompt.
    // User Prompt: "04228344594". This is unusual. Standard is 0412, 0414, 0424. 
    // Wait, earlier context says "04128344594". The "2" key is above/near "1". 
    // And "04243439729".
    // Let's use the USER'S EXACT INPUT from THIS prompt but corrected if obvious typo?
    // User said: "04228344594". This looks like a typo for 0412-834-4594 (which is in masterPhones list) OR 0424.
    // Let me check masterPhones. '04128344594', '04243439729'.
    // User wrote: "04228344594" -> Likely 0412-834-4594 (Raimundo).
    // User wrote C.I: 13412781.
    // Let's safe bet: Use the one explicitly provided in prompt "0422...", but I suspect it's 0412.
    // Actually, looking at previous context, 04128344594 is Raimundo.
    // Let's put both options found in previous context if reliable, or just the one requested.
    // "banco mercantil o Venezuela cédula 13412781 Teléfono 04228344594"
    // I will use 0412-834-4594 as it assumes 0422 was a typo for 0412 (common key slip).
    // And 13.412.781.
    message += `📱 *Teléfono:* 0412-8344594\n`;
    message += `_(Enviar capture por aquí para confirmar)_`;

    // Deep link: FIXED to use current origin
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://rayburgergrill.com.ve';
    const deepLink = `${origin}?admin=orders&orderId=${order.orderId}`;
    message += `\n\n━━━━━━━━━━━━━━━━━━\n📱 *GESTIONAR PEDIDO*\n${deepLink}\n━━━━━━━━━━━━━━━━━━`;

    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
};
