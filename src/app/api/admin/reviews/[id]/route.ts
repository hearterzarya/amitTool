import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { imageUrl, caption, sortOrder, isActive } = body;

    let updateData: any = {};
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (caption !== undefined) updateData.caption = caption || null;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (isActive !== undefined) updateData.isActive = isActive;

    let screenshot;
    try {
      if ('reviewScreenshot' in prisma && typeof (prisma as any).reviewScreenshot?.update === 'function') {
        screenshot = await (prisma as any).reviewScreenshot.update({
          where: { id },
          data: updateData,
        });
      } else {
        return NextResponse.json(
          { error: 'Database schema not updated. Please run migrations.' },
          { status: 500 }
        );
      }
    } catch (error: any) {
      console.error('Error updating screenshot:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update screenshot' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, screenshot });
  } catch (error: any) {
    console.error('Error in PUT /api/admin/reviews/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update screenshot' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    let screenshot;
    try {
      if ('reviewScreenshot' in prisma && typeof (prisma as any).reviewScreenshot?.findUnique === 'function') {
        // First, get the screenshot to get the image URL for file deletion
        screenshot = await (prisma as any).reviewScreenshot.findUnique({
          where: { id },
        });

        if (!screenshot) {
          return NextResponse.json(
            { error: 'Screenshot not found' },
            { status: 404 }
          );
        }

        // Delete the database record
        if (typeof (prisma as any).reviewScreenshot?.delete === 'function') {
          await (prisma as any).reviewScreenshot.delete({
            where: { id },
          });
        } else {
          return NextResponse.json(
            { error: 'Database schema not updated. Please run migrations.' },
            { status: 500 }
          );
        }

        // Optionally delete the file from filesystem (if it's a local file)
        if (screenshot.imageUrl && screenshot.imageUrl.startsWith('/uploads/')) {
          try {
            const { unlink } = await import('fs/promises');
            const { join } = await import('path');
            const filePath = join(process.cwd(), 'public', screenshot.imageUrl);
            const { existsSync } = await import('fs');
            
            if (existsSync(filePath)) {
              await unlink(filePath);
            }
          } catch (fileError) {
            // Log but don't fail if file deletion fails
            console.warn('Failed to delete file:', screenshot.imageUrl, fileError);
          }
        }
      } else {
        return NextResponse.json(
          { error: 'Database schema not updated. Please run migrations.' },
          { status: 500 }
        );
      }
    } catch (error: any) {
      console.error('Error deleting screenshot:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to delete screenshot' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/reviews/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete screenshot' },
      { status: 500 }
    );
  }
}
