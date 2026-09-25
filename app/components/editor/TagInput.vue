<script setup lang="ts">
// Chip-style tag field: comma or enter commits the typed tag, backspace on an empty input removes the last one.
const props = defineProps<{ modelValue: string[]; placeholder?: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string[]): void }>()

const draft = ref('')
const input = ref<HTMLInputElement>()

function commit() {
  const t = draft.value.replace(/,/g, '').trim()
  draft.value = ''
  if (!t || props.modelValue.includes(t)) return
  emit('update:modelValue', [...props.modelValue, t])
}
function removeAt(i: number) {
  emit('update:modelValue', props.modelValue.filter((_, j) => j !== i))
}
function onInput() {
  if (draft.value.includes(',')) commit()
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') { e.preventDefault(); commit() }
  else if (e.key === 'Backspace' && !draft.value && props.modelValue.length) removeAt(props.modelValue.length - 1)
}
</script>

<template>
  <div class="input tags" @click="input?.focus()">
    <code v-for="(t, i) in modelValue" :key="t" class="chip">
      {{ t }}<button type="button" class="x" :title="`remove ${t}`" @click.stop="removeAt(i)">×</button>
    </code>
    <input ref="input" v-model="draft" class="raw" :placeholder="modelValue.length ? '' : placeholder" @input="onInput" @keydown="onKeydown" @blur="commit" />
  </div>
</template>

<style scoped>
.tags { display: flex; flex-wrap: wrap; gap: 0.35rem; align-items: center; cursor: text; padding: 0.4rem 0.6rem; }
.tags:focus-within { border-color: var(--green); box-shadow: 0 0 0 3px rgba(0, 220, 130, 0.15); }
.chip { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.8rem; line-height: 1.5; padding: 0.05rem 0.2rem 0.05rem 0.45rem; border: 1px solid var(--line-strong); border-radius: 4px; background: var(--green-faint); color: var(--green-light); }
.x { background: transparent; border: 0; padding: 0 0.2rem; color: var(--green-dim); cursor: pointer; line-height: 1; }
.x:hover { color: var(--danger); }
.raw { flex: 1; min-width: 8ch; background: transparent; border: 0; outline: none; padding: 0.15rem 0; color: var(--green-light); }
.raw::placeholder { color: rgba(184, 255, 224, 0.3); }
</style>
