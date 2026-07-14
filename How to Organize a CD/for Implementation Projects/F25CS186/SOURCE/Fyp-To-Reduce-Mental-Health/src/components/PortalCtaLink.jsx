import { Link } from 'react-router-dom'
import { isExternalPortalHref } from '../lib/authPaths.js'

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
