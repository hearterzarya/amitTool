'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolCard } from '@/components/tools/tool-card';

interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  category: string;
  icon: string | null;
  toolUrl: string;
  priceMonthly: number;
  // Duration-specific prices
  sharedPlanPrice1Month?: number | null;
  sharedPlanPrice3Months?: number | null;
  sharedPlanPrice6Months?: number | null;
  sharedPlanPrice1Year?: number | null;
  privatePlanPrice1Month?: number | null;
  privatePlanPrice3Months?: number | null;
  privatePlanPrice6Months?: number | null;
  privatePlanPrice1Year?: number | null;
  // Legacy fields
  sharedPlanPrice: number | null;
  privatePlanPrice: number | null;
  sharedPlanFeatures: string | null;
  privatePlanFeatures: string | null;
  sharedPlanEnabled: boolean;
  privatePlanEnabled: boolean;
  isActive: boolean;
  isFeatured: boolean | null;
  sortOrder: number;
}

interface CategoryToolsSearchProps {
  tools: Tool[];
  categoryLabel: string;
}

export function CategoryToolsSearch({ tools: initialTools, categoryLabel }: CategoryToolsSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) {
      return initialTools;
    }

    const query = searchQuery.toLowerCase();
    return initialTools.filter(tool => {
      const nameMatch = tool.name.toLowerCase().includes(query);
      const descriptionMatch = tool.description?.toLowerCase().includes(query) || 
                               tool.shortDescription?.toLowerCase().includes(query);
      
      // Search in plan features
      const sharedFeatures = tool.sharedPlanFeatures?.toLowerCase() || '';
      const privateFeatures = tool.privatePlanFeatures?.toLowerCase() || '';
      const featuresMatch = sharedFeatures.includes(query) || privateFeatures.includes(query);

      return nameMatch || descriptionMatch || featuresMatch;
    });
  }, [searchQuery, initialTools]);

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
          <Input
            type="text"
            placeholder={`Search ${categoryLabel} tools, plans, or features...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 text-sm sm:text-base border-2 border-slate-300 focus:border-purple-500 rounded-lg"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8 p-0"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          )}
        </div>
        {searchQuery && (
          <p className="text-xs sm:text-sm text-slate-600 mt-2 text-center">
            Found {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'} in {categoryLabel}
          </p>
        )}
      </div>

      {/* Tools Grid */}
      {filteredTools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTools.map((tool, idx) => (
            <div
              key={tool.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <ToolCard tool={{
                ...tool,
                shortDescription: tool.shortDescription || undefined,
                description: tool.description || undefined,
                icon: tool.icon || undefined,
                sharedPlanPrice: tool.sharedPlanPrice || undefined,
                privatePlanPrice: tool.privatePlanPrice || undefined,
                sharedPlanEnabled: tool.sharedPlanEnabled || false,
                privatePlanEnabled: tool.privatePlanEnabled || false,
              }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-600">
            {searchQuery ? `No tools found matching "${searchQuery}" in ${categoryLabel}` : 'No tools available in this category.'}
          </p>
        </div>
      )}
    </div>
  );
}
