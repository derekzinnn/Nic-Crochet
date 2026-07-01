import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <section className="relative min-h-screen px-[clamp(20px,5vw,64px)] pt-[108px] pb-[90px] bg-panel">
      <div className="max-w-[920px] mx-auto">
        <div className="flex items-center justify-between mb-[30px]">
          <Skeleton className="h-12 w-48 bg-panel-line" />
          <Skeleton className="h-10 w-24 rounded-pill bg-panel-line" />
        </div>
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-32 bg-panel-line" />
          <Skeleton className="h-10 w-32 rounded-pill bg-panel-line" />
        </div>
        <div className="flex flex-col gap-[10px]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 bg-panel-card border border-panel-line rounded-[14px] p-3"
            >
              <Skeleton className="w-[54px] h-[64px] rounded-[10px] bg-panel-line" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-5 w-40 bg-panel-line" />
                <Skeleton className="h-3 w-24 bg-panel-line" />
              </div>
              <Skeleton className="h-8 w-28 rounded-[20px] bg-panel-line" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
