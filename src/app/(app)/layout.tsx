import { BottomNav } from '@/components/layout/bottom-nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950">
      <main className="pb-20 md:pb-0 min-h-screen max-w-2xl mx-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
