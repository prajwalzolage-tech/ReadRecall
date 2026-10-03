// src/app/api/attempts/route.ts
// GET: List user attempts
// POST: Save attempt

import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/auth-helper';
import { getAttemptsByUserId, saveAttempt, getUserProfile } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authResult = await verifyRequest(request);
  if ('error' in authResult) return authResult.error;
  const { user } = authResult;

  try {
    const articleId = request.nextUrl.searchParams.get('articleId');
    const attempts = await getAttemptsByUserId(user.uid, articleId);

    return NextResponse.json({ attempts });
  } catch (error) {
    console.error('Error listing attempts:', error);
    return NextResponse.json(
      { error: 'Failed to list attempts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await verifyRequest(request);
  if ('error' in authResult) return authResult.error;
  const { user } = authResult;

  try {
    const data = await request.json();

    // Check privacy settings
    let storeSummary = true;
    try {
      const profile = await getUserProfile(user.uid, user.email);
      if (profile?.privacySummary === true) {
        storeSummary = false;
      }
    } catch {
      // ignore
    }

    const attemptData: any = {
      ...data,
      userId: user.uid,
      createdAt: new Date().toISOString(),
    };

    if (!storeSummary) {
      delete attemptData.summary;
    }

    const saved = await saveAttempt(attemptData);
    return NextResponse.json(saved);
  } catch (error) {
    console.error('Error saving attempt:', error);
    return NextResponse.json(
      { error: 'Failed to save attempt' },
      { status: 500 }
    );
  }
}
