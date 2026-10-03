// src/app/api/user/profile/route.ts
// GET and PATCH: User profile and privacy settings

import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/auth-helper';
import { getUserProfile, updateUserProfile } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authResult = await verifyRequest(request);
  if ('error' in authResult) return authResult.error;
  const { user } = authResult;

  try {
    const profile = await getUserProfile(user.uid, user.email);
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const authResult = await verifyRequest(request);
  if ('error' in authResult) return authResult.error;
  const { user } = authResult;

  try {
    const body = await request.json();
    const updates: Record<string, any> = {};

    if (typeof body.privacySummary === 'boolean') {
      updates.privacySummary = body.privacySummary;
    }

    const updated = await updateUserProfile(user.uid, updates);
    return NextResponse.json({ success: true, ...updated });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
