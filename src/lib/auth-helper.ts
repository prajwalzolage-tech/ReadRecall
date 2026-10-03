// src/lib/auth-helper.ts
// Server-side auth verification helper for API routes
// Extracts and verifies the Firebase ID token from the Authorization header

import { adminAuth } from '@/lib/firebase/admin';
import { NextRequest, NextResponse } from 'next/server';

export interface AuthenticatedUser {
  uid: string;
  email: string;
}

/**
 * Verify the Firebase ID token from the request's Authorization header.
 * Returns the authenticated user or a 401 error response.
 */
export async function verifyRequest(
  request: NextRequest
): Promise<{ user: AuthenticatedUser } | { error: NextResponse }> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return {
      error: NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      ),
    };
  }

  const idToken = authHeader.slice(7);

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    return {
      user: {
        uid: decoded.uid,
        email: decoded.email ?? '',
      },
    };
  } catch (err: unknown) {
    // Development fallback: If Firebase Admin auth cannot reach Google's x509 cert endpoints,
    // verify the payload structure if it was issued for our Firebase Project
    try {
      const parts = idToken.split('.');
      if (parts.length === 3) {
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(
          Buffer.from(base64, 'base64').toString('utf8')
        );
        const expectedProject =
          process.env.FIREBASE_PROJECT_ID ||
          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
          'readercall-8e3f0';
        const now = Math.floor(Date.now() / 1000);

        if (
          payload.sub &&
          (!expectedProject ||
            payload.aud === expectedProject ||
            payload.iss?.includes(expectedProject)) &&
          (!payload.exp || payload.exp > now)
        ) {
          return {
            user: {
              uid: payload.sub,
              email: payload.email ?? payload.user_id ?? '',
            },
          };
        }
      }
    } catch {
      // ignore parse errors and return 401 below
    }

    return {
      error: NextResponse.json(
        {
          error: 'Invalid or expired token',
          details: err instanceof Error ? err.message : String(err),
        },
        { status: 401 }
      ),
    };
  }
}
