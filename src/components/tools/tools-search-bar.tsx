'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';

export function ToolsSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set('search', query.trim());
    } else {
      params.delete('search');
    }
    router.push(`/tools?${params.toString()}`);
  };

  const handleClear = () => {
    setSearchQuery('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('search');
    router.push(`/tools?${params.toString()}`);
  };

  return (
    <div className="mb-8 sm:mb-12">
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search tools, plans, or features..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch(searchQuery);
              }
            }}
            className="pl-10 sm:pl-12 pr-10 sm:pr-12 py-4 sm:py-5 md:py-6 text-base sm:text-lg border-2 border-slate-300 focus:border-purple-500 rounded-lg sm:rounded-xl"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8 p-0"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          )}
        </div>
        {searchQuery && (
          <p className="text-xs sm:text-sm text-slate-600 mt-2 text-center">
            Searching for: "{searchQuery}"
          </p>
        )}
      </div>
    </div>
  );
}
