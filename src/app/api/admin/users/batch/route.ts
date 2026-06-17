import { NextRequest, NextResponse } from 'next/server';
import { getDb, logAdminAction } from '@/lib/db';
import { getAdminUser } from '@/lib/auth';

export async function DELETE(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const ids: number[] = body.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
    }

    const db = getDb();
    const placeholders = ids.map(() => '?').join(',');

    const deletedCount = db.prepare(
      `DELETE FROM users WHERE id IN (${placeholders}) AND id != ?`
    ).run(...ids, user.id).changes;

    logAdminAction(user.id, user.username, 'batch_delete', 'user', undefined, `Deleted ${deletedCount} users`);

    return NextResponse.json({ deleted: deletedCount });
  } catch {
    return NextResponse.json({ error: 'Batch delete failed' }, { status: 500 });
  }
}