type PageHeaderProps = {
  eyebrow: string
  title: string
  description: string
  children?: React.ReactNode
}

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: PageHeaderProps) {
  return (
    <div className="grid gap-5 border-border/80 pb-7 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:border-b">
      <div className="max-w-3xl space-y-3">
        <p className="text-[0.72rem] font-bold tracking-[0.22em] text-primary uppercase">
          {eyebrow}
        </p>
        <div className="space-y-2">
          <h1 className="font-heading text-4xl leading-[0.95] font-semibold text-balance tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      {children ? (
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {children}
        </div>
      ) : null}
    </div>
  )
}
