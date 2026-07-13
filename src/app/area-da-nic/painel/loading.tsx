import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <div className="flex items-end justify-between mb-[22px]">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-48 bg-line-card" />
          <Skeleton className="h-3 w-56 bg-line-card" />
        </div>
        <Skeleton className="h-11 w-36 rounded-pill bg-line-card" />
      </div>
      <div className="grid grid-cols-1 min-[881px]:grid-cols-3 gap-[14px] mb-[26px]">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-[16px] bg-line-card" />
        ))}
      </div>
      <div className="flex flex-col gap-[10px]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 bg-white border border-line-card rounded-[16px] px-[18px] py-[14px]"
          >
            <Skeleton className="w-[52px] h-[52px] rounded-[12px] bg-line-card" />
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton className="h-5 w-40 bg-line-card" />
              <Skeleton className="h-3 w-24 bg-line-card" />
            </div>
            <Skeleton className="h-8 w-28 rounded-[20px] bg-line-card" />
          </div>
        ))}
      </div>
    </div>
  );
}
