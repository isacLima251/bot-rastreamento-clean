import React from 'react'

export function Card({ children, className = '', ...props }) {
  return (
    <div className={`bg-white ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 className={className} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={className} {...props}>
      {children}
    </p>
  )
}
