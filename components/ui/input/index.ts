import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';

export { default as Input } from './Input.vue';

export const inputVariants = cva(
  'flex w-full border-border bg-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        default: 'h-48 text-16 px-16',
        sm: 'h-40 text-14 px-14',
        lg: 'h-52 text-18 px-18',
      },
      inputStyle: {
        default:
          'rounded-md border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0',
        line: 'rounded-none border-b p-0',
      },
    },
    defaultVariants: {
      size: 'default',
      inputStyle: 'default',
    },
  }
);

export type InputVariants = VariantProps<typeof inputVariants>;
