// src/app/loading.tsx
// Global route loading indicator

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      <p className="text-sm text-slate-400 font-medium">Loading ReadRecall...</p>
    </div>
  );
}
