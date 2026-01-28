'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Upload, Trash2, Edit, GripVertical, X } from 'lucide-react';
import Image from 'next/image';

interface Screenshot {
  id: string;
  imageUrl: string;
  caption: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ReviewsManagementClientProps {
  screenshots: Screenshot[];
}

export function ReviewsManagementClient({ screenshots: initialScreenshots }: ReviewsManagementClientProps) {
  const [screenshots, setScreenshots] = useState(initialScreenshots);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingScreenshot, setEditingScreenshot] = useState<Screenshot | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({ imageUrl: '', caption: '', sortOrder: 0 });
  const { toast } = useToast();

  const handleOpenDialog = (screenshot?: Screenshot) => {
    if (screenshot) {
      setEditingScreenshot(screenshot);
      setFormData({
        imageUrl: screenshot.imageUrl,
        caption: screenshot.caption || '',
        sortOrder: screenshot.sortOrder,
      });
    } else {
      setEditingScreenshot(null);
      setFormData({ 
        imageUrl: '', 
        caption: '', 
        sortOrder: screenshots.length > 0 ? Math.max(...screenshots.map(s => s.sortOrder)) + 1 : 0 
      });
    }
    setDialogOpen(true);
    setUploading(false);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingScreenshot(null);
    const nextSortOrder = screenshots.length > 0 
      ? Math.max(...screenshots.map(s => s.sortOrder)) + 1 
      : 0;
    setFormData({ imageUrl: '', caption: '', sortOrder: nextSortOrder });
    setUploading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Image size should be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await fetch('/api/admin/reviews/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.url) {
        setFormData(prev => ({ ...prev, imageUrl: data.url }));
        toast({
          title: 'Success',
          description: 'Image uploaded successfully',
        });
      } else {
        throw new Error(data.error || 'Upload failed - no URL returned');
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.imageUrl) {
      toast({
        title: 'Error',
        description: 'Please upload an image',
        variant: 'destructive',
      });
      return;
    }

    try {
      const url = editingScreenshot
        ? `/api/admin/reviews/${editingScreenshot.id}`
        : '/api/admin/reviews';
      const method = editingScreenshot ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (data.success) {
        toast({
          title: 'Success',
          description: editingScreenshot ? 'Screenshot updated successfully' : 'Screenshot added successfully',
        });

        if (editingScreenshot) {
          setScreenshots(prev =>
            prev.map(s => (s.id === editingScreenshot.id ? data.screenshot : s))
          );
        } else {
          setScreenshots(prev => [...prev, data.screenshot]);
        }

        // Reset form and close dialog
        handleCloseDialog();
      } else {
        throw new Error(data.error || 'Failed to save screenshot');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save screenshot',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this screenshot?')) return;

    try {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Screenshot deleted',
        });
        setScreenshots(prev => prev.filter(s => s.id !== id));
      } else {
        throw new Error(data.error || 'Failed to delete');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete screenshot',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: !isActive ? 'Screenshot is now visible' : 'Screenshot is now hidden',
        });
        setScreenshots(prev =>
          prev.map(s => (s.id === id ? { ...s, isActive: !isActive } : s))
        );
      } else {
        throw new Error(data.error || 'Failed to update status');
      }
    } catch (error: any) {
      console.error('Error toggling active status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update screenshot status',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Reviews & Proofs Management</h1>
        <p className="text-slate-600">Manage WhatsApp purchase screenshots for the reviews page</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Screenshots</CardTitle>
              <CardDescription>
                Upload and manage WhatsApp purchase screenshots (7-8 recommended)
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Upload className="mr-2 h-4 w-4" />
              Add Screenshot
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {screenshots.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No screenshots yet. Click "Add Screenshot" to upload one.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {screenshots.map((screenshot) => (
                <Card
                  key={screenshot.id}
                  className={`relative overflow-hidden ${!screenshot.isActive ? 'opacity-50' : ''}`}
                >
                  <div className="relative aspect-[9/16] w-full bg-slate-100">
                    <Image
                      src={screenshot.imageUrl}
                      alt={screenshot.caption || 'Screenshot'}
                      fill
                      className="object-cover"
                      unoptimized={screenshot.imageUrl.startsWith('/uploads')}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    {!screenshot.isActive && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">Hidden</span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="mb-2">
                      <p className="text-sm font-medium text-slate-900 mb-1">
                        {screenshot.caption || 'No caption'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>Order: {screenshot.sortOrder}</span>
                        <span>•</span>
                        <span className={screenshot.isActive ? 'text-green-600' : 'text-orange-600'}>
                          {screenshot.isActive ? 'Active' : 'Hidden'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(screenshot)}
                        className="flex-1 min-w-[80px]"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(screenshot.id, screenshot.isActive)}
                        className={screenshot.isActive ? 'border-orange-300 text-orange-700 hover:bg-orange-50' : 'border-green-300 text-green-700 hover:bg-green-50'}
                      >
                        {screenshot.isActive ? 'Hide' : 'Show'}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(screenshot.id)}
                        className="flex-shrink-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open) {
          handleCloseDialog();
        } else {
          setDialogOpen(true);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingScreenshot ? 'Edit Screenshot' : 'Add Screenshot'}
            </DialogTitle>
            <DialogDescription>
              Upload a WhatsApp purchase screenshot for the reviews page
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="image-upload">Image</Label>
              {!formData.imageUrl ? (
                <div className="mt-2">
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  {uploading && <p className="text-sm text-slate-500 mt-2">Uploading...</p>}
                </div>
              ) : (
                <div className="mt-2 relative">
                  <div className="relative w-full h-64 border rounded-lg overflow-hidden">
                    <Image
                      src={formData.imageUrl}
                      alt="Preview"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="caption">Caption (Optional)</Label>
              <Input
                id="caption"
                value={formData.caption}
                onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
                placeholder="Enter caption..."
              />
            </div>
            <div>
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                type="number"
                min="0"
                value={formData.sortOrder}
                onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: Math.max(0, parseInt(e.target.value) || 0) }))}
                placeholder="0"
              />
              <p className="text-xs text-slate-500 mt-1">
                Lower numbers appear first. Default: {screenshots.length}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button"
              variant="outline" 
              onClick={handleCloseDialog}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={handleSave} 
              disabled={!formData.imageUrl || uploading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {uploading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {editingScreenshot ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  {editingScreenshot ? 'Update' : 'Add'} Screenshot
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
