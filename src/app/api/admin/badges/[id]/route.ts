import { NextRequest, NextResponse } from 'next/server';
import { getDb, logAdminAction } from '@/lib/db';
import { getAdminUser } from '@/lib/auth';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().min(1).max(100).optional(),
  description: z.string().min(1).optional(),
  condition: z.string().min(1).max(100).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const badgeId = Number(id);

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM badges WHERE id = ?').get(badgeId);
    if (!existing) {
      return NextResponse.json({ error: 'Badge not found' }, { status: 404 });
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    if (parsed.data.name !== undefined) {
      fields.push('name = ?');
      values.push(parsed.data.name);
    }
    if (parsed.data.icon !== undefined) {
      fields.push('icon = ?');
      values.push(parsed.data.icon);
    }
    if (parsed.data.description !== undefined) {
      fields.push('description = ?');
      values.push(parsed.data.description);
    }
    if (parsed.data.condition !== undefined) {
      fields.push('condition = ?');
      values.push(parsed.data.condition);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(badgeId);
    db.prepare(`UPDATE badges SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    logAdminAction(user.id, user.username, 'update', 'badge', badgeId, 'Updated badge');

    const updated = db.prepare('SELECT * FROM badges WHERE id = ?').get(badgeId);
    return NextResponse.json({ badge: updated });
  } catch {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const badgeId = Number(id);

  try {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM badges WHERE id = ?').get(badgeId);
    if (!existing) {
      return NextResponse.json({ error: 'Badge not found' }, { status: 404 });
    }

    db.prepare('DELETE FROM user_badges WHERE badge_id = ?').run(badgeId);
    db.prepare('DELETE FROM badges WHERE id = ?').run(badgeId);

    logAdminAction(user.id, user.username, 'delete', 'badge', badgeId, 'Deleted badge');

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
