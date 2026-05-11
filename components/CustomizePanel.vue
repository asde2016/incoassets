<script setup lang="ts">
import { useCustomize } from '~/stores/customize';

const c = useCustomize();
</script>

<template>
  <aside class="sticky top-24 self-start">
    <Card>
      <CardHeader class="pb-12">
        <div class="flex items-center justify-between">
          <CardTitle class="text-16">Customize</CardTitle>
          <button
            type="button"
            class="rounded-md border border-gray-200 bg-white px-12 py-4 text-12 text-gray-600 transition hover:bg-gray-100"
            @click="c.reset()">
            Reset
          </button>
        </div>
      </CardHeader>
      <CardContent class="space-y-20">
        <div>
          <div class="mb-8 flex items-center justify-between">
            <label for="cz-size" class="text-13 text-gray-700">Size</label>
            <span class="text-12 text-gray-500">{{ c.size }}px</span>
          </div>
          <input
            id="cz-size"
            type="range"
            min="32"
            max="128"
            step="4"
            class="range-feather"
            v-model.number="c.size" />
        </div>

        <div>
          <div class="mb-8 flex items-center justify-between">
            <label for="cz-stroke" class="text-13 text-gray-700">Stroke width</label>
            <span class="text-12 text-gray-500">{{ c.strokeWidth }}px</span>
          </div>
          <input
            id="cz-stroke"
            v-model.number="c.strokeWidth"
            type="range"
            min="4"
            max="8"
            step="1"
            class="range-feather" />
        </div>

        <div>
          <div class="mb-8 text-13 text-gray-700">Style</div>
          <div class="inline-flex rounded-md border border-gray-200 bg-white p-2 text-12">
            <button
              type="button"
              class="rounded px-12 py-4 transition"
              :class="
                c.mode === 'default'
                  ? 'bg-dark text-dark-foreground'
                  : 'text-gray-600 hover:bg-gray-100'
              "
              @click="c.mode = 'default'">
              Default
            </button>
            <button
              type="button"
              class="rounded px-12 py-4 transition"
              :class="
                c.mode === 'linear'
                  ? 'bg-dark text-dark-foreground'
                  : 'text-gray-600 hover:bg-gray-100'
              "
              @click="c.mode = 'linear'">
              Linear
            </button>
          </div>
        </div>

        <div class="flex items-center gap-8">
          <input
            v-model="c.color"
            type="color"
            aria-label="색상 선택"
            class="color-swatch h-32 w-32 cursor-pointer rounded-md border border-gray-200" />
          <input
            v-model="c.color"
            type="text"
            class="h-32 flex-1 rounded-md border border-gray-200 px-12 font-mono text-13 outline-none focus:border-primary" />
        </div>
      </CardContent>
    </Card>
  </aside>
</template>
