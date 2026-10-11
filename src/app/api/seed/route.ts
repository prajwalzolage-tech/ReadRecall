import { NextResponse } from 'next/server';
import { CURATED_ARTICLES } from '@/lib/curated-articles';
import { saveArticle, isFirestoreConfigured } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isFirestoreConfigured()) {
    return NextResponse.json(
      { error: 'Firestore is not configured. Please ensure your Firebase environment variables are set.' },
      { status: 400 }
    );
  }

  try {
    const results = [];
    
    for (const article of CURATED_ARTICLES) {
      // saveArticle automatically handles pushing to Firestore if configured
      const saved = await saveArticle(article);
      results.push(saved.id);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully seeded ${results.length} curated articles directly into your Firestore database!`,
      seededIds: results
    });
  } catch (error: any) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      { success: false, error: error.message }, 
      { status: 500 }
    );
  }
}
