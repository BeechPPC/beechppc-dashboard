import { Sidebar } from '@/components/navigation/sidebar'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Animated background */}
      <div className="blob-bg">
        <div className="blob" style={{
          top: '10%',
          left: '20%',
          width: '300px',
          height: '300px',
          background: 'var(--primary-mid)',
        }} />
        <div className="blob" style={{
          top: '60%',
          right: '20%',
          width: '400px',
          height: '400px',
          background: 'var(--primary-light)',
          animationDelay: '-5s',
        }} />
      </div>

      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  )
}
