import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <section className="relative min-h-screen px-[clamp(20px,5vw,64px)] pt-[108px] pb-[90px] bg-sand">
      <div className="max-w-[960px] mx-auto">
        <Skeleton className="h-4 w-40 mb-6" />
        <div className="grid grid-cols-1 min-[721px]:grid-cols-2 bg-cream rounded-[24px] overflow-hidden">
          <Skeleton className="aspect-[3/4] w-full rounded-none" />
          <div className="p-[clamp(26px,3vw,44px)] flex flex-col gap-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-12 w-full rounded-pill mt-4" />
          </div>
        </div>
      </div>
    </section>
  );
}
