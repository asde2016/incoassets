import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Configure tailwind-merge to recognize text-{number} as fontSize
const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: Array.from({ length: 200 }, (_, i) => String(i + 1)) }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs));
}
