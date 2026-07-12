
interface LoadingSkeletonProps {
  type: 'card' | 'table' | 'chart' | 'list';
  count?: number;
}

export function LoadingSkeleton({ type, count = 3 }: LoadingSkeletonProps) {
  const shimmerClass = "animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl";

  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {Array.from({ length: count * 2 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-250/60 dark:border-slate-800/80 p-5 rounded-2xl space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
              <div className={`h-4 w-24 ${shimmerClass}`} />
              <div className={`h-8 w-8 rounded-lg ${shimmerClass}`} />
            </div>
            <div className="space-y-2">
              <div className={`h-8 w-16 ${shimmerClass}`} />
              <div className={`h-3 w-32 ${shimmerClass}`} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex gap-4">
          <div className={`h-6 w-32 ${shimmerClass}`} />
          <div className="ml-auto flex gap-2">
            <div className={`h-8 w-24 ${shimmerClass}`} />
            <div className={`h-8 w-24 ${shimmerClass}`} />
          </div>
        </div>
        <div className="p-4 space-y-4">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-2 border-b border-slate-50 dark:border-slate-850 last:border-0">
              <div className={`h-10 w-10 rounded-full ${shimmerClass}`} />
              <div className="space-y-1.5 flex-1">
                <div className={`h-4 w-1/4 ${shimmerClass}`} />
                <div className={`h-3 w-1/3 ${shimmerClass}`} />
              </div>
              <div className={`h-6 w-16 ${shimmerClass}`} />
              <div className={`h-8 w-20 ${shimmerClass}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-[300px] w-full">
        <div className="flex justify-between items-center">
          <div className={`h-5 w-40 ${shimmerClass}`} />
          <div className="flex gap-2">
            <div className={`h-3 w-12 ${shimmerClass}`} />
            <div className={`h-3 w-12 ${shimmerClass}`} />
          </div>
        </div>
        <div className="flex items-end gap-3 h-48 w-full px-2">
          {Array.from({ length: 8 }).map((_, i) => {
            const heights = ['h-16', 'h-32', 'h-24', 'h-40', 'h-12', 'h-28', 'h-36', 'h-20'];
            return (
              <div key={i} className={`flex-1 ${heights[i % heights.length]} ${shimmerClass} rounded-t-lg rounded-b-none`} />
            );
          })}
        </div>
        <div className="flex justify-between w-full pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`h-3 w-10 ${shimmerClass}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-4 rounded-xl flex items-center justify-between shadow-xs">
          <div className="space-y-2 flex-1 mr-4">
            <div className={`h-4 w-1/3 ${shimmerClass}`} />
            <div className={`h-3 w-1/2 ${shimmerClass}`} />
          </div>
          <div className={`h-8 w-16 ${shimmerClass}`} />
        </div>
      ))}
    </div>
  );
}
