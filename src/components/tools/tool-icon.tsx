'use client';

import { useState } from "react";
import Image from "next/image";

interface ToolIconProps {
  icon?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const sizeClasses = {
  sm: { container: 'w-8 h-8', text: 'text-2xl' },
  md: { container: 'w-12 h-12', text: 'text-3xl' },
  lg: { container: 'w-16 h-16', text: 'text-4xl' },
  xl: { container: 'w-20 h-20', text: 'text-5xl' },
  '2xl': { container: 'w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36', text: 'text-5xl sm:text-6xl lg:text-7xl' },
};

const imageSizes = {
  sm: '32px',
  md: '48px',
  lg: '64px',
  xl: '80px',
  '2xl': '224px',
};

export function ToolIcon({ icon, name, size = 'md', className = '' }: ToolIconProps) {
  const [imageError, setImageError] = useState(false);
  const isImage = icon && (icon.startsWith('/') || icon.startsWith('http')) && !imageError;
  const sizeClass = sizeClasses[size];

  if (isImage) {
    return (
      <div className={`relative ${sizeClass.container} rounded-lg overflow-hidden bg-gray-50 border border-gray-200 ${className}`}>
        <Image
          src={icon}
          alt={name}
          fill
          className="object-contain p-1"
          sizes={imageSizes[size]}
          unoptimized={icon.startsWith('http')}
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${sizeClass.container} ${sizeClass.text} ${className}`}>
      {icon || "🛠️"}
    </div>
  );
}
