export default function Loading() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 border-4 border-stone-200 border-t-slate-800 rounded-full animate-spin"></div>
        <p className="text-stone-600">Loading...</p>
      </div>
    </div>
  );
}
