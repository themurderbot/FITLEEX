import Link from 'next/link'
import { cn } from '@/lib/utils'

interface AuthCardProps {
  title:       string
  subtitle?:   string
  children:    React.ReactNode
  className?:  string
}

export function AuthCard({ title, subtitle, children, className }: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[500px] h-[500px] rounded-full bg-brand/5 blur-[100px]" />
      </div>

      <div className={cn('relative w-full max-w-md', className)}>
        {/* Logo */}
        <Link href="/" className="flex justify-center mb-8">
          <span className="font-display text-3xl text-brand tracking-wide">FITLEEX</span>
        </Link>

        {/* Card */}
        <div className="card p-8">
          <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
          {subtitle && <p className="text-sm text-muted mb-6">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  )
}
