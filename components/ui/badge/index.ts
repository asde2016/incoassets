import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';

export { default as Badge } from './Badge.vue';

export const badgeVariants = cva(
  'inline-flex gap-1 items-center rounded-full border px-2.5 py-0.5 text-xs font-normal',
  {
    variants: {
      variant: {
        primary: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent border-transparent bg-secondary text-white ',
        danger: 'border-transparent bg-danger text-white ',
        success: 'border-transparent bg-success text-white ',
        info: ' border-transparent bg-info text-white ',
        warning: ' border-transparent bg-warning text-white',
        outline: '',
        'outline-primary': 'border-primary text-primary',
        'outline-secondary': 'border border-secondary text-secondary ',
        'outline-danger': 'border border-danger text-danger ',
        'outline-success': 'border border-success text-success ',
        'outline-info': 'border border-info text-info ',
        'outline-warning': 'border border-warning text-warning ',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  }
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;
