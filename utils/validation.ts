import type { z } from 'zod';

/**
 * Zod 스키마 기반 유효성 검사 composable
 *
 * @example
 * const { errors, validate, check } = validation(schema, () => ({ field: value }));
 *
 * <Input :invalid="!!errors.field" :invalid-message="errors.field" @input="check('field')" />
 *
 * if (!validate(refs)) return;
 */
export function validation<T extends z.ZodType>(schema: T, getData: () => unknown) {
  const errors = reactive<Record<string, string>>({});

  const validate = (refs?: Record<string, any>): boolean => {
    Object.keys(errors).forEach(key => {
      errors[key] = '';
    });

    const result = schema.safeParse(getData());
    if (result.success) return true;

    result.error.errors.forEach((err, index) => {
      const fieldName = err.path[0] as string;
      if (!errors[fieldName]) errors[fieldName] = err.message;

      if (index === 0 && refs?.[fieldName]?.value) {
        const el = refs[fieldName].value.$el?.querySelector('input, textarea, select');
        if (el instanceof HTMLElement) el.focus();
      }
    });

    return false;
  };

  const check = (field: string) => {
    if (!errors[field]) return;
    const result = schema.safeParse(getData());
    if (result.success || !result.error.errors.some(e => e.path[0] === field)) {
      errors[field] = '';
    }
  };

  return { errors, validate, check };
}
