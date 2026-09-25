<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { Markdown } from 'tiptap-markdown'

const props = defineProps<{
  modelValue: string
  upload: (file: File) => Promise<string>
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void; (e: 'log', msg: string): void }>()

const lowlight = createLowlight(common)
const languages = ['', ...lowlight.listLanguages().sort()]
let lastEmitted = props.modelValue

const insertFiles = async (files: File[]) => {
  for (const f of files) {
    if (!f.type.startsWith('image/')) continue
    emit('log', `uploading ${f.name} (${Math.round(f.size / 1024)} KB)…`)
    try {
      const url = await props.upload(f)
      editor.value?.chain().focus().setImage({ src: url, alt: f.name.replace(/\.[^.]+$/, '') }).run()
      emit('log', `✓ image committed → ${url}`)
    } catch (e: any) {
      emit('log', `✗ upload failed: ${e?.message || e}`)
    }
  }
}

const editor = useEditor({
  content: props.modelValue,
  autofocus: 'end',
  extensions: [
    StarterKit.configure({ codeBlock: false, heading: { levels: [2, 3, 4] } }),
    CodeBlockLowlight.configure({ lowlight, defaultLanguage: null, HTMLAttributes: { class: 'hljs' } }),
    Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener', target: '_blank' } }),
    Image.configure({ inline: false, allowBase64: false }),
    Placeholder.configure({ placeholder: "type '/' for nothing special, just start writing. markdown shortcuts work: # ## - 1. > ``` **bold** _em_ `code`" }),
    Markdown.configure({ html: true, tightLists: true, bulletListMarker: '-', linkify: true, breaks: false, transformPastedText: true, transformCopiedText: true }),
  ],
  editorProps: {
    attributes: { class: 'prose editor-surface', spellcheck: 'true' },
    handleDrop: (_view, event) => {
      const files = Array.from(event.dataTransfer?.files || [])
      if (files.some((f) => f.type.startsWith('image/'))) { event.preventDefault(); insertFiles(files); return true }
      return false
    },
    handlePaste: (_view, event) => {
      const files = Array.from(event.clipboardData?.files || [])
      if (files.some((f) => f.type.startsWith('image/'))) { event.preventDefault(); insertFiles(files); return true }
      return false
    },
  },
  onUpdate: ({ editor }) => {
    const md: string = editor.storage.markdown.getMarkdown()
    lastEmitted = md
    emit('update:modelValue', md)
  },
})

watch(() => props.modelValue, (v) => {
  if (v !== lastEmitted && editor.value) {
    lastEmitted = v
    editor.value.commands.setContent(v, false)
  }
})

const fileInput = ref<HTMLInputElement>()
const pickImage = () => fileInput.value?.click()
const onFilePicked = (e: Event) => {
  const input = e.target as HTMLInputElement
  insertFiles(Array.from(input.files || []))
  input.value = ''
}

const setLink = () => {
  const ed = editor.value!
  const prev = ed.getAttributes('link').href as string | undefined
  const url = window.prompt('link url', prev || 'https://')
  if (url === null) return
  if (url === '') return ed.chain().focus().extendMarkRange('link').unsetLink().run()
  if (ed.state.selection.empty) {
    ed.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run()
  } else {
    ed.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }
}

const codeLang = computed({
  get: () => (editor.value?.getAttributes('codeBlock').language as string) || '',
  set: (l: string) => editor.value?.chain().focus().updateAttributes('codeBlock', { language: l || null }).run(),
})

const words = computed(() => (props.modelValue.trim().match(/\S+/g) || []).length)
const readMin = computed(() => Math.max(1, Math.round(words.value / 220)))

const tools = computed(() => {
  const ed = editor.value
  if (!ed) return []
  return [
    { label: 'B', title: 'bold ⌘B', on: () => ed.chain().focus().toggleBold().run(), active: ed.isActive('bold') },
    { label: 'I', title: 'italic ⌘I', on: () => ed.chain().focus().toggleItalic().run(), active: ed.isActive('italic'), italic: true },
    { label: 'S', title: 'strike ⌘⇧X', on: () => ed.chain().focus().toggleStrike().run(), active: ed.isActive('strike'), strike: true },
    { label: '`c`', title: 'inline code ⌘E', on: () => ed.chain().focus().toggleCode().run(), active: ed.isActive('code') },
    { sep: true },
    { label: 'H2', title: 'heading 2 ⌘⌥2', on: () => ed.chain().focus().toggleHeading({ level: 2 }).run(), active: ed.isActive('heading', { level: 2 }) },
    { label: 'H3', title: 'heading 3 ⌘⌥3', on: () => ed.chain().focus().toggleHeading({ level: 3 }).run(), active: ed.isActive('heading', { level: 3 }) },
    { sep: true },
    { label: '• list', title: 'bullet list ⌘⇧8', on: () => ed.chain().focus().toggleBulletList().run(), active: ed.isActive('bulletList') },
    { label: '1. list', title: 'ordered list ⌘⇧7', on: () => ed.chain().focus().toggleOrderedList().run(), active: ed.isActive('orderedList') },
    { label: '❝ quote', title: 'blockquote ⌘⇧B', on: () => ed.chain().focus().toggleBlockquote().run(), active: ed.isActive('blockquote') },
    { label: '```', title: 'code block ⌘⌥C', on: () => ed.chain().focus().toggleCodeBlock().run(), active: ed.isActive('codeBlock') },
    { sep: true },
    { label: '🔗', title: 'link ⌘K', on: setLink, active: ed.isActive('link') },
    { label: '🖼', title: 'image (or paste / drop one)', on: pickImage, active: false },
    { label: '—', title: 'horizontal rule', on: () => ed.chain().focus().setHorizontalRule().run(), active: false },
    { sep: true },
    { label: '↶', title: 'undo ⌘Z', on: () => ed.chain().focus().undo().run(), active: false, disabled: !ed.can().undo() },
    { label: '↷', title: 'redo ⌘⇧Z', on: () => ed.chain().focus().redo().run(), active: false, disabled: !ed.can().redo() },
  ] as Array<any>
})

const onKeydown = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setLink() }
}

onBeforeUnmount(() => editor.value?.destroy())
</script>

<template>
  <div class="pe terminal" @keydown="onKeydown">
    <div class="bar toolbar">
      <template v-for="(t, i) in tools" :key="i">
        <span v-if="t.sep" class="tsep" />
        <button v-else type="button" class="tb" :class="{ on: t.active, it: t.italic, st: t.strike }" :title="t.title" :disabled="t.disabled" @mousedown.prevent @click="t.on">{{ t.label }}</button>
      </template>
      <select v-if="editor?.isActive('codeBlock')" v-model="codeLang" class="lang" title="code block language">
        <option v-for="l in languages" :key="l" :value="l">{{ l || 'plain' }}</option>
      </select>
      <span class="count">{{ words }} words · ~{{ readMin }} min</span>
    </div>
    <EditorContent :editor="editor" class="surface" />
    <input ref="fileInput" type="file" accept="image/*" multiple hidden @change="onFilePicked" />
  </div>
</template>

<style>
/* overflow must stay visible: with the terminal's overflow:hidden the panel becomes the sticky container and the
   toolbar pins 56px down inside it, covering the first line of the document. */
.pe.terminal { overflow: visible; }
.pe .surface { min-height: 55vh; }
.pe .editor-surface { outline: none; padding: 1.4rem 1.6rem; min-height: 55vh; max-width: none; font-size: 0.95rem; }
.pe .toolbar { flex-wrap: wrap; gap: 2px; position: sticky; top: 56px; z-index: 5; background: #020805; border-radius: var(--radius) var(--radius) 0 0; }
.pe .tb { background: transparent; border: 1px solid transparent; border-radius: 4px; padding: 0.15rem 0.5rem; color: var(--green-dim); cursor: pointer; font-size: 0.78rem; }
.pe .tb:hover { color: var(--green); border-color: var(--line-strong); }
.pe .tb.on { color: #000; background: var(--green); }
.pe .tb.it { font-style: italic; }
.pe .tb.st { text-decoration: line-through; }
.pe .tb:disabled { opacity: 0.3; cursor: default; }
.pe .tsep { width: 1px; height: 16px; background: var(--line-strong); margin: 0 0.35rem; }
.pe .lang { background: #000; border: 1px solid var(--line-strong); border-radius: 4px; color: var(--green); font-size: 0.75rem; padding: 0.1rem 0.4rem; }
.pe .count { margin-left: auto; color: var(--muted); font-size: 0.72rem; white-space: nowrap; }
.pe p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: rgba(184, 255, 224, 0.3); float: left; height: 0; pointer-events: none; }
.pe .ProseMirror-selectednode { outline: 2px solid var(--green); }
.pe img { border: 1px solid var(--line); }
.pe a { cursor: text; }

/* lowlight (highlight.js classes) theme, green-tinted */
.pe .hljs-comment, .pe .hljs-quote { color: rgba(184, 255, 224, 0.4); font-style: italic; }
.pe .hljs-keyword, .pe .hljs-selector-tag, .pe .hljs-built_in, .pe .hljs-type { color: #4dffb0; }
.pe .hljs-string, .pe .hljs-attr, .pe .hljs-template-variable, .pe .hljs-addition { color: #c6ff9e; }
.pe .hljs-number, .pe .hljs-literal, .pe .hljs-symbol, .pe .hljs-bullet { color: #ffd97a; }
.pe .hljs-title, .pe .hljs-function .hljs-title, .pe .hljs-section, .pe .hljs-name { color: #7cffc4; font-weight: 600; }
.pe .hljs-variable, .pe .hljs-attribute, .pe .hljs-regexp, .pe .hljs-link { color: #9be7ff; }
.pe .hljs-deletion { color: var(--danger); }
.pe .hljs-meta, .pe .hljs-tag { color: rgba(184, 255, 224, 0.7); }
.pe .hljs-emphasis { font-style: italic; }
.pe .hljs-strong { font-weight: 700; }
</style>
