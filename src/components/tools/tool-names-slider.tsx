'use client';

import { useEffect, useState } from 'react';

interface ToolNamesSliderProps {
  tools: Array<{ name: string; id: string }>;
}

export function ToolNamesSlider({ tools }: ToolNamesSliderProps) {
  const [toolNames, setToolNames] = useState<string[]>([]);

  useEffect(() => {
    if (tools.length === 0) return;
    
    // Extract tool names
    const names = tools.map(t => t.name);
    
    // Duplicate the array enough times for seamless infinite scroll
    // We need at least 2 copies to create the illusion of infinite scroll
    setToolNames([...names, ...names, ...names, ...names]);
  }, [tools]);

  if (toolNames.length === 0) {
    return null;
  }

  return (
    <div className="w-full overflow-hidden relative">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 glass-card rounded-lg"></div>
      
      <div className="relative w-full py-4 sm:py-5 md:py-6">
        <div className="flex animate-scroll-infinite whitespace-nowrap">
          {/* First set of items */}
          {toolNames.map((name, index) => (
            <div
              key={`first-${name}-${index}`}
              className="inline-flex items-center mx-4 sm:mx-6 md:mx-8 lg:mx-10 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-display font-semibold text-foreground/80 hover:text-primary transition-colors duration-300"
            >
              {name}
              <span className="mx-4 sm:mx-6 md:mx-8 lg:mx-10 text-primary/50">•</span>
            </div>
          ))}
          {/* Duplicate set for seamless loop */}
          {toolNames.map((name, index) => (
            <div
              key={`second-${name}-${index}`}
              className="inline-flex items-center mx-4 sm:mx-6 md:mx-8 lg:mx-10 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-display font-semibold text-foreground/80 hover:text-primary transition-colors duration-300"
            >
              {name}
              <span className="mx-4 sm:mx-6 md:mx-8 lg:mx-10 text-primary/50">•</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
