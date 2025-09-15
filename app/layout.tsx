import './globals.css'
import Link from 'next/link'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-gray-50 antialiased">
        <header className="border-b bg-white">
          <div className="container-page flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Campus Department Administration</h1>
              <p className="text-sm text-gray-500">Next 15 • React 19 • Drizzle • Neon</p>
            </div>
            <nav className="flex items-center gap-3 text-sm">
              <Link className="text-gray-700 hover:text-gray-900" href="/">Overview</Link>
              <span className="text-gray-300">|</span>
              <Link className="text-gray-700 hover:text-gray-900" href="/manage">Manage</Link>
            </nav>
          </div>
        </header>
        <main className="container-page space-y-6">
          {children}
        </main>
      </body>
    </html>
  )
}
