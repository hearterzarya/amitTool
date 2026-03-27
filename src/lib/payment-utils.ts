/**
 * Builds a UPI deep link for mobile apps.
 * @param params { upiId, payeeName, amount, orderId }
 * @returns string upi://pay link
 */
export function buildUpiLink({
    upiId,
    payeeName,
    amount,
    orderId
}: {
    upiId: string;
    payeeName: string;
    amount: number | string;
    orderId: string;
}) {
    const params = new URLSearchParams({
        pa: upiId,
        pn: payeeName,
        am: amount.toString(),
        cu: 'INR',
        tn: `Order ID ${orderId}`
    });

    return `upi://pay?${params.toString()}`;
}

/**
 * Copies text to the clipboard.
 * @param text string
 */
export async function copyToClipboard(text: string) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy text: ', err);
        return false;
    }
}

/**
 * Builds a WhatsApp message link.
 * @param params { phone, message }
 * @returns string whatsapp link
 */
export function buildWhatsAppLink({
    phone,
    message
}: {
    phone: string;
    message: string;
}) {
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
