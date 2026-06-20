import * as React from "react"
import { cn } from "@/utils/cn"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-arena-red text-white hover:bg-red-600 shadow-lg shadow-red-900/20',
      secondary: 'bg-arena-blue text-white hover:bg-blue-600 shadow-lg shadow-blue-900/20',
      accent: 'bg-arena-gold text-black hover:bg-yellow-500 shadow-lg shadow-yellow-900/20',
      outline: 'border-2 border-slate-700 hover:border-slate-500 text-slate-300',
      ghost: 'hover:bg-slate-800 text-slate-400 hover:text-slate-100'
    }

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg'
    }

    return (
      <button
        className={cn(
          "arena-button inline-flex items-center justify-center font-bold uppercase tracking-wider",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
