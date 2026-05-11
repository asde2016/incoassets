import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';

export { default as Checkbox } from './Checkbox.vue';
export { default as CheckboxField } from './CheckboxField.vue';

export const checkboxVariants = cva(
  'peer shrink-0 place-content-center rounded-sm border border-border bg-white ring-offset-background focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-white grid',
  {
    variants: {
      size: {
        md: 'h-[18px] w-[18px]',
        sm: 'h-[14px] w-[14px]',
        lg: 'h-[22px] w-[22px]',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export type CheckboxVariants = VariantProps<typeof checkboxVariants>;
