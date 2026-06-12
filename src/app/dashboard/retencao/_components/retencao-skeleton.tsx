import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/** Loading silhouette for /dashboard/retencao — mirrors the discount banner + tier table. */
export function RetencaoSkeleton() {
  return (
    <>
      {/* Discount banner */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-72 max-w-full" />
              <Skeleton className="h-4 w-80 max-w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tier table */}
      <Card className="mb-6">
        <CardHeader>
          <Skeleton className="h-6 w-44" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
