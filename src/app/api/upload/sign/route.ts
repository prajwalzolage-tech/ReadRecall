// src/app/api/upload/sign/route.ts
// POST: Generates signed parameters for direct-to-Cloudinary uploads

import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/auth-helper';
import { generateUploadSignature } from '@/lib/cloudinary';
import { checkRateLimit } from '@/lib/rate-limit';
import { RATE_LIMIT_UPLOAD } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authResult = await verifyRequest(request);
  if ('error' in authResult) return authResult.error;
  const { user } = authResult;

  // Rate limiting (5 per minute)
  const rateLimit = checkRateLimit(`upload:${user.uid}`, RATE_LIMIT_UPLOAD);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Upload rate limit exceeded. Please wait a minute.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      }
    );
  }

  try {
    const signData = generateUploadSignature('readrecall/uploads');
    return NextResponse.json(signData);
  } catch (error) {
    console.error('Error generating upload signature:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload signature' },
      { status: 500 }
    );
  }
}
