const SkeletonCard = () => (
  <div className="glass rounded-lg p-4 flex gap-3 animate-pulse">
    <div className="w-20 h-20 rounded-md bg-secondary" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-secondary rounded w-3/4" />
      <div className="h-3 bg-secondary rounded w-1/2" />
      <div className="h-3 bg-secondary rounded w-1/3 mt-3" />
    </div>
  </div>
);

export const SkeletonList = ({ count = 4 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export default SkeletonCard;
