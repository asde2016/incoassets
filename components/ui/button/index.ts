import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';

export { default as Button } from './Button.vue';

export const buttonVariants = cva(
  'h-fit inline-flex items-center justify-center gap-6 rounded-md font-medium transition-colors leading-[1.25] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'border border-transparent bg-primary text-primary-foreground hover:bg-primary-hover',
        secondary:
          'border border-transparent bg-secondary text-white hover:bg-secondary-hover focus-visible:ring-secondary-ring',
        danger:
          'border border-transparent bg-danger text-white hover:bg-danger-hover focus-visible:ring-danger-ring',
        success:
          'border border-transparent bg-success text-white hover:bg-success-hover focus-visible:ring-success-ring',
        info: 'border border-transparent bg-info text-white hover:bg-info-hover focus-visible:ring-info-ring',
        warning:
          'border border-transparent bg-warning text-white hover:bg-warning-hover focus-visible:ring-warning-ring',
        outline: 'border hover:border-primary-hover',
        'outline-primary':
          'border border-primary text-primary hover:border-primary-hover hover:text-primary-hover',
        'outline-primary-2':
          'border border-transparent hover:border-primary hover:text-primary focus:border-primary focus:text-primary',
        'outline-secondary':
          'border border-secondary text-secondary hover:border-secondary-hover hover:text-secondary-hover focus-visible:ring-secondary-ring',
        'outline-danger':
          'border border-danger text-danger hover:border-danger-hover hover:text-danger-hover focus-visible:ring-danger-ring',
        'outline-success':
          'border border-success text-success hover:border-success-hover hover:text-success-hover focus-visible:ring-success-ring',
        'outline-info':
          'border border-info text-info hover:border-info-hover hover:text-info-hover focus-visible:ring-info-ring',
        'outline-warning':
          'border border-warning text-warning hover:border-warning-hover hover:text-warning-hover focus-visible:ring-warning-ring',
        ghost: 'text-accent-foreground hover:bg-accent',
        none: 'text-accent-foreground focus:font-semibold hover:font-semibold',
        link: 'text-primary underline-offset-4 hover:underline',
        dark: 'bg-dark text-white',
      },
      size: {
        default: 'px-16 py-[0.688rem] text-md', // h-48
        sm: 'px-14 py-[0.563rem] text-sm', // h-40
        lg: 'px-18 py-[0.75rem] text-lg', // h-52
        icon: 'h-48 w-48',
        'icon-sm': 'size-36',
        'icon-lg': 'size-56',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
