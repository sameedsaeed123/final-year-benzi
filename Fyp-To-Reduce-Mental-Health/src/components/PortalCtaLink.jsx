import { Link } from 'react-router-dom'
import { isExternalPortalHref } from '../lib/authPaths.js'

/**
 * In-app route or external admin app link (same styles as navbar CTA).
 */
export default function PortalCtaLink({ href, className, children, onClick }) {
  if (isExternalPortalHref(href)) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    )
  }
  return (
    <Link to={href || '/login'} className={className} onClick={onClick}>
      {children}
    </Link>
  )
}
