"use client"

import Link from 'next/link'
import React from 'react'
import { prefetchSel } from '@/lib/prefetchSel'

type Props = React.PropsWithChildren<{
  href: string
  className?: string
}>

export default function PrefetchSelLink({ href, children, className }: Props) {
  return (
    <Link href={href} className={className} onMouseEnter={() => prefetchSel()} onFocus={() => prefetchSel()}>
      {children}
    </Link>
  )
}
