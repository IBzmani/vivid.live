import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const limitCount = parseInt(searchParams.get('limit') || '30', 10);

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const logsQuery = query(
      collection(db, 'users', userId, 'credit_logs'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(logsQuery);
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('[/api/credits/history] Error:', error);
    return NextResponse.json({ logs: [] });
  }
}
