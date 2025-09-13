import { Button } from '@/components/ui/button'
import { navigate } from '@/lib/router'

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-foreground">404 – Page Not Found</h1>
        <p className="mt-2 text-muted-foreground">The page you’re looking for doesn’t exist.</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button onClick={() => navigate({ name: 'new' })}>Go to Home</Button>
        </div>
      </div>
    </div>
  )
}
