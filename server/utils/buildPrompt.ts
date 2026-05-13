import {
  buildPrompt as buildPromptTemplate,
  type PromptInput,
} from '~/composables/promptGuide';

export type BuildPromptInput = PromptInput;

export type BuildPromptResult = {
  prompt: string;
};

export function buildPrompt(input: BuildPromptInput): BuildPromptResult {
  if (!input.keyword.trim()) {
    throw new Error('buildPrompt: keyword required');
  }
  return { prompt: buildPromptTemplate(input) };
}
