'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { ContactInfo } from '@/lib/app-settings';

const ContactInfoContext = createContext<ContactInfo | null>(null);

export function ContactInfoProvider({
  initialContactInfo,
  children,
}: {
  initialContactInfo: ContactInfo;
  children: ReactNode;
}) {
  const value = useMemo(() => initialContactInfo, [initialContactInfo.whatsappNumber, initialContactInfo.supportPhone]);
  return (
    <ContactInfoContext.Provider value={value}>
      {children}
    </ContactInfoContext.Provider>
  );
}

export function useContactInfo(): ContactInfo {
  const ctx = useContext(ContactInfoContext);
  if (!ctx) {
    // Fallback for components outside provider (e.g. admin layout) – use brand
    const { brand } = require('@/lib/brand');
    return { whatsappNumber: brand.whatsappNumber, supportPhone: brand.supportPhone };
  }
  return ctx;
}
