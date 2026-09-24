<script setup lang="ts">
definePageMeta({ layout: 'bare' })
useSeoMeta({ title: 'nothing to see here', robots: 'noindex, nofollow' })
useHead({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

const config = useRuntimeConfig()
const session = useSession()
const { me, repoInfo } = useGithub()

const revealed = ref(false)
const tokenInput = ref('')
const remember = ref(true)
const busy = ref(false)
const error = ref('')
const typed = ref('')
const SECRET = 'mack'

onMounted(async () => {
  // Already signed in on this device? Straight to the editor.
  if (session.load()) {
    try { await me(); return navigateTo('/editor', { replace: true }) } catch { session.clear() }
  }
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

function onKey(e: KeyboardEvent) {
  if (revealed.value || e.metaKey || e.ctrlKey || e.altKey) return
  if (e.key.length !== 1) return
  typed.value = (typed.value + e.key.toLowerCase()).slice(-SECRET.length)
  if (typed.value === SECRET) revealed.value = true
}

async function submit() {
  error.value = ''
  const t = tokenInput.value.trim()
  if (!t) return
  busy.value = true
  session.save(t, remember.value)
  try {
    const u = await me()
    if (u.login.toLowerCase() !== config.public.ownerLogin.toLowerCase()) throw new Error(`token belongs to @${u.login}, not @${config.public.ownerLogin}`)
    await repoInfo()
    session.user.value = u
    await navigateTo('/editor', { replace: true })
  } catch (e: any) {
    session.clear()
    error.value = e?.message || 'could not verify token'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="gate">
    <div class="box" v-reveal>
      <p class="prompt muted">sudo login</p>
      <h1 class="msg">
        For anyone not named <em @dblclick="revealed = true">Kenneth McKrola</em>,<br />
        go check me out <NuxtLink to="/">here →</NuxtLink>
      </h1>
      <p class="muted small">(there's nothing for you on this page. the good stuff is on the home page.)</p>

      <Transition name="drop">
        <form v-if="revealed" class="terminal form" @submit.prevent="submit">
          <div class="bar"><i /><i /><i /><span>auth · github fine-grained token · contents:write on {{ config.public.repo }}</span></div>
          <div class="body">
            <p class="prompt">paste token</p>
            <input v-model="tokenInput" class="input" type="password" autocomplete="off" spellcheck="false" placeholder="github_pat_…" autofocus />
            <label class="check"><input v-model="remember" type="checkbox" /> remember on this device</label>
            <div class="actions">
              <button class="btn" type="submit" :disabled="busy || !tokenInput">{{ busy ? 'verifying…' : 'enter editor →' }}</button>
              <span v-if="error" class="err">✗ {{ error }}</span>
            </div>
            <p class="muted small">the token never leaves your browser except to api.github.com.</p>
          </div>
        </form>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.gate { flex: 1; display: flex; align-items: center; justify-content: center; padding: 2rem 20px; }
.box { max-width: 720px; width: 100%; }
.msg { font-size: clamp(1.4rem, 3.5vw, 2.4rem); font-weight: 600; }
.msg em { font-style: normal; color: var(--green); user-select: none; }
.small { font-size: 0.8rem; }
.form { margin-top: 2.5rem; }
.form .body { display: flex; flex-direction: column; gap: 0.75rem; }
.actions { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
.err { color: var(--danger); font-size: 0.85rem; }
.drop-enter-active { transition: all 0.4s var(--ease); }
.drop-enter-from { opacity: 0; transform: translateY(-10px); }
</style>
