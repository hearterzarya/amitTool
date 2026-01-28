import Image from "next/image";

interface ToolIconProps {
  icon?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: { container: 'w-8 h-8', text: 'text-2xl' },
  md: { container: 'w-12 h-12', text: 'text-3xl' },
  lg: { container: 'w-16 h-16', text: 'text-4xl' },
  xl: { container: 'w-20 h-20', text: 'text-5xl' },
};

const imageSizes = {
  sm: '32px',
  md: '48px',
  lg: '64px',
  xl: '80px',
};

export function ToolIcon({ icon, name, size = 'md', className = '' }: ToolIconProps) {
  // Check if icon is an image URL or path
  const isImage = icon && (icon.startsWith('/') || icon.startsWith('http'));
  const sizeClass = sizeClasses[size];
  
  if (isImage) {
    try {
      return (
        <div className={`relative ${sizeClass.container} rounded-lg overflow-hidden bg-gray-50 border border-gray-200 ${className}`}>
          <Image
            src={icon}
            alt={name}
            fill
            className="object-contain p-1"
            sizes={imageSizes[size]}
            unoptimized={icon.startsWith('http')}
          />
        </div>
      );
    } catch (error) {
      // Fallback to emoji if image fails
      console.warn(`Failed to load image: ${icon}`, error);
      return (
        <div className={`flex items-center justify-center ${sizeClass.container} ${sizeClass.text} ${className}`}>
          {icon || "🛠️"}
        </div>
      );
    }
  }
  
  return (
    <div className={`flex items-center justify-center ${sizeClass.container} ${sizeClass.text} ${className}`}>
      {icon || "🛠️"}
    </div>
  );
}
