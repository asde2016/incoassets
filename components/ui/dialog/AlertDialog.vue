<script setup lang="ts">
import { computed, useSlots, h, type VNode, Fragment } from 'vue';
import { Dialog, DialogContent, DialogClose, DialogFooter, DialogTrigger } from '.';
import { Button } from '@/components/ui/button';

type AlertVariant = 'primary' | 'danger' | 'success' | 'info' | 'warning';

interface Props {
  variant?: AlertVariant;
  msg?: string;
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'info',
  msg: '알림 메세지',
  title: '알림 메세지',
});

// footer 내 button은 기본적으로 DialogClose
// clickClose: false 일 경우, 일반 버튼
const slots = useSlots();
function renderFooter() {
  const children = slots.footer?.() ?? [];
  const flatChildren = children.flatMap((child: VNode) =>
    child.type === Fragment ? (child.children as VNode[]) : [child]
  );

  return flatChildren.map((child: VNode) => {
    const clickClose = child.props?.clickClose;
    if (clickClose === false || clickClose === 'false') {
      const { clickClose: _, ...restProps } = child.props || {};
      return h(child, { ...restProps });
    }
    return h(DialogClose, { asChild: true }, () => h(child));
  });
}

const iconMap: Record<AlertVariant, string> = {
  primary: 'info_outline',
  danger: 'error_outline',
  success: 'check_circle_outline',
  info: 'info_outline',
  warning: 'warning_amber',
};

const icon = computed(() => iconMap[props.variant!]);
</script>

<template>
  <Dialog :close-icon="false">
    <DialogTrigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </DialogTrigger>
    <DialogContent size="sm">
      <div class="text-center">
        <div class="flex items-center justify-center gap-4 text-sm" :class="`text-${variant}`">
          <i class="material-icons text-18">{{ icon }}</i>
          {{ msg }}
        </div>
        <div class="mb-8 mt-16 text-lg font-semibold text-gray-900">
          <slot name="title" />
        </div>
        <slot />
      </div>
      <template #footer>
        <DialogFooter class="flex-col">
          <renderFooter />
        </DialogFooter>
      </template>
    </DialogContent>
  </Dialog>
</template>
