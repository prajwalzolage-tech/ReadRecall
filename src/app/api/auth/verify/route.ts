// src/app/api/auth/verify/route.ts
// Verifies Firebase ID tokens from the client
// Used to validate authentication before making authenticated API calls

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken } = body as { idToken?: string };

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json(
        { error: 'Missing idToken' },
        { status: 400 }
      );
    }

    const decoded = await adminAuth.verifyIdToken(idToken);

    return NextResponse.json({
      uid: decoded.uid,
      email: decoded.email,
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }
}
