import { BottomNav } from '@/components/layout/bottom-nav'
import { OfflineMessage } from '@/components/ui/offline-message'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950">
      <main className="pb-20 md:pb-0 min-h-screen max-w-2xl mx-auto">
        <OfflineMessage />
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
