export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-background via-background to-muted/40">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>
      <div className="relative">{children}</div>
    </div>
  )
}
