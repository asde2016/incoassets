import { cva } from 'class-variance-authority';

export { default as Timepicker } from './Timepicker.vue';

export const timepickerColumnStyle = cva(
  '[&::-webkit-scrollbar]:hidden flex h-[180px] w-[64px] flex-col overflow-y-auto overscroll-contain p-6',
  {
    variants: {
      bordered: {
        true: 'border-r border-border',
      },
    },
  }
);

export const timepickerItemStyle = cva(
  'flex h-36 shrink-0 items-center justify-center rounded-md text-14 font-medium transition-colors hover:text-primary hover:bg-primary-foreground focus:text-primary focus:bg-primary-foreground',
  {
    variants: {
      active: {
        true: 'text-primary',
      },
      keyup: {
        true: 'bg-primary-foreground text-primary',
      },
    },
  }
);
