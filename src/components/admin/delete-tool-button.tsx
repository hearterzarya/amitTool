'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';

interface DeleteToolButtonProps {
  toolId: string;
  toolName: string;
  hasActiveSubscriptions: boolean;
}

export function DeleteToolButton({ toolId, toolName, hasActiveSubscriptions }: DeleteToolButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (hasActiveSubscriptions) {
      alert('Cannot delete tool with active subscriptions. Please cancel all subscriptions first.');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${toolName}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/tools/${toolId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete tool');
      }
    } catch (error) {
      console.error('Error deleting tool:', error);
      alert('Failed to delete tool. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="destructive" 
      size="sm" 
      disabled={loading || hasActiveSubscriptions}
      onClick={handleDelete}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4 mr-2" />
      )}
      Delete
    </Button>
  );
}
