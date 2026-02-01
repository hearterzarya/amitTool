'use client';

import { brand } from '@/lib/brand';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { useContactInfo } from '@/components/providers/contact-info-provider';

interface WhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
}

export function WhatsAppButton({ 
  phoneNumber,
  message = brand.whatsappMessage
}: WhatsAppButtonProps) {
  const contactInfo = useContactInfo();
  const number = phoneNumber ?? contactInfo.whatsappNumber;
  const whatsappUrl = `https://wa.me/${number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
      aria-label="Chat with us on WhatsApp"
    >
      <WhatsAppIcon size={28} className="text-white" />
      <span className="absolute -top-12 right-0 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Chat with us
      </span>
    </a>
  );
}
