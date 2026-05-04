import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted dark:bg-brand-orange/5 border border-border dark:border-brand-orange/20 shadow-sm dark:shadow-[0_0_10px_rgba(172,229,4,0.08)]", className)}
      {...props}
    />
  )
}

export { Skeleton }
