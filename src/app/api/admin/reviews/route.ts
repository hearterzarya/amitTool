import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { imageUrl, caption, sortOrder } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    let screenshot;
    try {
      if ('reviewScreenshot' in prisma && typeof (prisma as any).reviewScreenshot?.create === 'function') {
        screenshot = await (prisma as any).reviewScreenshot.create({
          data: {
            imageUrl,
            caption: caption || null,
            sortOrder: sortOrder || 0,
            isActive: true,
          },
        });
      } else {
        return NextResponse.json(
          { error: 'Database schema not updated. Please run migrations.' },
          { status: 500 }
        );
      }
    } catch (error: any) {
      console.error('Error creating screenshot:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create screenshot' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, screenshot });
  } catch (error: any) {
    console.error('Error in POST /api/admin/reviews:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create screenshot' },
      { status: 500 }
    );
  }
}
