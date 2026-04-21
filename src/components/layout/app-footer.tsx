'use client';

import Link from "next/link";
import { brand } from "@/lib/brand";
import { Mail, Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { useContactInfo } from "@/components/providers/contact-info-provider";
import { BrandLogoMark } from "@/components/layout/brand-logo-mark";

export function AppFooter() {
  const contactInfo = useContactInfo();
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Product",
      links: [
        { href: "/tools", label: "All Tools" },
        { href: "/features", label: "Features" },
        { href: "/reviews", label: "Reviews" },
      ],
    },
    {
      title: "Support",
      links: [
        { href: "/faq", label: "FAQ" },
        { href: "/contact", label: "Contact Us" },
        {
          href: `https://wa.me/${contactInfo.whatsappNumber}`,
          label: "WhatsApp Support",
          external: true,
        },
      ],
    },
    {
      title: "Company",
      links: [
        { href: "/about", label: "About Us" },
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/terms", label: "Terms of Service" },
      ],
    },
  ];

  return (
    <footer className="gradient-surface-warm border-t border-border">
      <div className="container-custom">
        <div className="py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-16">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <Link 
                href="/" 
                className="flex items-center space-x-3 mb-6 group"
                aria-label="Home"
              >
                <BrandLogoMark size="md" />
                <span className="text-xl font-display font-semibold text-gradient-primary">
                  {brand.name}
                </span>
              </Link>
              <p className="text-foreground/70 text-sm leading-relaxed mb-8 max-w-md font-body">
                {brand.description}
              </p>
              
              {/* Contact Info */}
              <div className="space-y-3">
                <a
                  href={`mailto:${brand.supportEmail}`}
                  className="flex items-center space-x-3 text-foreground/60 hover:text-foreground transition-colors text-sm font-body"
                >
                  <Mail className="h-4 w-4" />
                  <span>{brand.supportEmail}</span>
                </a>
                <a
                  href={`tel:${contactInfo.supportPhone}`}
                  className="flex items-center space-x-3 text-foreground/60 hover:text-foreground transition-colors text-sm font-body"
                >
                  <Phone className="h-4 w-4" />
                  <span>{contactInfo.supportPhone}</span>
                </a>
                <a
                  href={`https://wa.me/${contactInfo.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 text-foreground/60 hover:text-foreground transition-colors text-sm font-body"
                >
                  <WhatsAppIcon size={16} className="flex-shrink-0" />
                  <span>WhatsApp Support</span>
                </a>
              </div>
            </div>

            {/* Footer Links */}
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-foreground font-display font-semibold mb-6 text-sm uppercase tracking-wider">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground/60 hover:text-foreground transition-colors text-sm font-body"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-foreground/60 hover:text-foreground transition-colors text-sm font-body"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Bar */}
          <div className="mt-16 pt-8 border-t border-border/30">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-foreground/50 text-sm text-center md:text-left font-body">
                &copy; {currentYear} {brand.name}. All rights reserved.
              </p>
              <div className="flex items-center space-x-6">
                <Link
                  href="/privacy"
                  className="text-foreground/50 hover:text-foreground transition-colors text-sm font-body"
                >
                  Privacy
                </Link>
                <Link
                  href="/terms"
                  className="text-foreground/50 hover:text-foreground transition-colors text-sm font-body"
                >
                  Terms
                </Link>
                <a
                  href={`https://wa.me/${contactInfo.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/50 hover:text-foreground transition-colors text-sm font-body"
                >
                  Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
