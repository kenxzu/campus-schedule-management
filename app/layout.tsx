import './globals.css'
import Link from 'next/link'
import { Inter } from 'next/font/google'
import ClientProviders from '../components/ClientProviders'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`min-h-dvh bg-gray-50 antialiased ${inter.className}`}>
        <header className="border-b bg-gradient-to-r from-blue-600 to-black text-white">
          <div className="container-page flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Campus Department Administration</h1>
              <p className="text-sm/6 text-blue-100">Next 15 • React 19 • Drizzle • Neon</p>
            </div>
            <nav className="flex items-center gap-4 text-sm">
              <Link className="hover:text-yellow-300" href="/">Overview</Link>
              <span className="text-white/40">|</span>
              <Link className="hover:text-yellow-300" href="/schedules">Schedules</Link>
              <span className="text-white/40">|</span>
              <Link className="hover:text-yellow-300" href="/manage">Manage</Link>
            </nav>
          </div>
        </header>
        <main className="container-page space-y-6">
          <ClientProviders>
            {children}
          </ClientProviders>
        </main>
      </body>
    </html>
  )
}
