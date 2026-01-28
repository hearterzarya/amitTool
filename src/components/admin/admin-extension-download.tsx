'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useState } from 'react';

export function AdminExtensionDownload() {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      
      // Try direct download first
      const link = document.createElement('a');
      link.href = '/extension/admin-extension.zip';
      link.download = 'admin-extension.zip';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Clean up after a short delay
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 100);

      // Fallback: try API route if direct download doesn't work
      setTimeout(async () => {
        try {
          const response = await fetch('/api/extension/admin-download');
          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const fallbackLink = document.createElement('a');
            fallbackLink.href = url;
            fallbackLink.download = 'admin-extension.zip';
            fallbackLink.style.display = 'none';
            document.body.appendChild(fallbackLink);
            fallbackLink.click();
            window.URL.revokeObjectURL(url);
            setTimeout(() => {
              if (document.body.contains(fallbackLink)) {
                document.body.removeChild(fallbackLink);
              }
            }, 100);
          }
        } catch (apiError) {
          console.error('API download error:', apiError);
          // Final fallback: open in new tab
          window.open('/extension/admin-extension.zip', '_blank');
        } finally {
          setIsDownloading(false);
        }
      }, 500);
    } catch (error) {
      console.error('Download error:', error);
      // Fallback: open in new tab if download fails
      window.open('/extension/admin-extension.zip', '_blank');
      setIsDownloading(false);
    }
  };

  return (
    <Button 
      onClick={handleDownload} 
      className="w-full" 
      disabled={isDownloading}
    >
      <Download className="mr-2 h-4 w-4" />
      {isDownloading ? 'Downloading...' : 'Download Admin Extension (ZIP)'}
    </Button>
  );
}
