import React from 'react'

export function Badge({ children, className = '', ...props }) {
  return (
    <span className={className} {...props}>
      {children}
    </span>
  )
}

export default Badge
