<template>
  <pre class="language-html bg-black" v-html="highlightedCode"></pre>
  <!--<code class=" p-8 whitespace-pre-line"/>-->
</template>

<script setup lang="ts">
import Prism from 'prismjs';
import 'prismjs/themes/prism-okaidia.min.css';

const props = defineProps<{
  code: string;
  lang?: string;
}>();

const lang = computed(() => props.lang ?? 'html');

const highlightedCode = computed(() => {
  const grammar = Prism.languages[lang.value];
  const trimmed = props.code.trim();
  if (!grammar) return escapeHtml(trimmed);
  return Prism.highlight(trimmed, grammar, lang.value);
});

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
</script>
