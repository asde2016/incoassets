import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';

export { default as RadioGroup } from './RadioGroup.vue';
export { default as RadioGroupItem } from './RadioGroupItem.vue';
export { default as RadioGroupField } from './RadioGroupField.vue';
export { default as RadioGroupItemBlock } from './RadioGroupItemBlock.vue';

export const radioGroupItemVariants = cva(
  'peer shrink-0 place-content-center rounded-full border border-border bg-white disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:text-white grid',
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

export type RadioGroupItemVariants = VariantProps<typeof radioGroupItemVariants>;
