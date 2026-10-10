'use client'

import Link from 'next/link'

/** App-like phone navigation is local to the learner product area. */
export function LearnerMobileNavigation() {
  return <nav className="learn-mobile-nav" aria-label="Mobile learning navigation"><Link href="/">⌂<small>Home</small></Link><Link href="/learning" aria-current="page">◉<small>Learning</small></Link><Link href="/">⌕<small>Explore</small></Link><Link href="/">☻<small>Account</small></Link></nav>
}
