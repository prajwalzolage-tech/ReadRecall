import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ReadRecall — Active Recall Reading & Comprehension Platform',
  description:
    'Read timed technical articles, write recall summaries from memory, and get instant 1–10 AI ratings with streamed coaching feedback. Webcam-based engagement monitoring, 5-dimension evaluation, and 6 safety guards — all on-device, all privacy-first.',
  keywords: [
    'active recall',
    'reading comprehension',
    'AI evaluation',
    'Jev',
    'TypeSafe',
    'MediaPipe',
    'study tool',
    'webcam engagement',
    'technical articles',
  ],
  openGraph: {
    title: 'ReadRecall — Active Recall Reading & Comprehension Platform',
    description:
      'Timed reading → article hidden → write from memory → instant AI evaluation with coaching. Privacy-first webcam engagement monitoring.',
    type: 'website',
  },
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Landing page renders its own sticky nav, so skip the app-level NavBar.
  return <>{children}</>;
}
