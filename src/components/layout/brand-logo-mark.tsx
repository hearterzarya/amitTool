'use client';

import Image from 'next/image';
import { brand } from '@/lib/brand';
import { cn } from '@/lib/utils';

export function BrandLogoMark({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md';
  className?: string;
}) {
  const dim = size === 'sm' ? 36 : 44;
  return (
    <div
      className={cn(
        'relative flex-shrink-0 overflow-hidden rounded-xl border border-border/40 bg-white shadow-md',
        className
      )}
    >
      <Image
        src={brand.logoUrl}
        alt={`${brand.name} logo`}
        width={dim}
        height={dim}
        className="object-cover"
        sizes={`${dim}px`}
        priority
      />
    </div>
  );
}
