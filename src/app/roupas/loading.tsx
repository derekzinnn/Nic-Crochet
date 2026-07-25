import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <section className="relative min-h-screen px-[clamp(20px,5vw,64px)] pt-[108px] pb-[90px] bg-cream">
      <div className="max-w-shell mx-auto">
        <div className="flex flex-col items-center gap-3 mb-9">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-12 w-[320px] max-w-full" />
          <Skeleton className="h-4 w-[420px] max-w-full" />
        </div>
        <div className="flex justify-center gap-3 mb-4 flex-wrap">
          <Skeleton className="h-[50px] w-[min(440px,100%)] rounded-pill" />
          <Skeleton className="h-[50px] w-32 rounded-pill" />
        </div>
        <div className="flex justify-center mb-9">
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-[clamp(16px,2.2vw,30px)]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[3/4] w-full rounded-[18px]" />
              <Skeleton className="h-5 w-3/4 mt-4" />
              <Skeleton className="h-3 w-1/3 mt-2" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
