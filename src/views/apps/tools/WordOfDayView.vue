<template>
  <div class="wod-root">
    <Navbar />
    <main class="wod-content" style="--house-color: var(--primary-color, #f3c300)">
      <GamificationPageHeader
        title="Mot de la semaine physio"
        description="Un terme de physiothérapie ou d’anatomie à trouver en 6 essais. Le même mot pour tout le monde, du lundi au dimanche."
        eyebrow="Espace jeux"
        icon="pi pi-book"
        @back="router.push('/game')"
      />

      <section v-if="phase === 'loading'" class="wod-panel wod-center" aria-busy="true">
        <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
        <p role="status">Chargement du mot de la semaine…</p>
      </section>

      <section v-else-if="phase === 'error'" class="wod-panel wod-center" aria-labelledby="wod-error-title">
        <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
        <h2 id="wod-error-title">Le mot de la semaine n’a pas pu être chargé</h2>
        <p>Vérifiez votre connexion, puis réessayez.</p>
        <Button label="Réessayer" icon="pi pi-refresh" class="wod-primary" @click="load" />
      </section>

      <section v-else-if="phase === 'restricted'" class="wod-panel wod-center" aria-labelledby="wod-restricted-title">
        <i class="pi pi-lock" aria-hidden="true"></i>
        <h2 id="wod-restricted-title">Jeu réservé aux joueurs</h2>
        <p>Le mot de la semaine est ouvert aux étudiantes et étudiants qui participent à la gamification.</p>
        <Button label="Revenir aux jeux" icon="pi pi-arrow-left" class="wod-primary" @click="router.push('/game')" />
      </section>

      <div v-else class="wod-layout">
        <section class="wod-panel wod-game" aria-labelledby="wod-game-title">
          <div class="wod-game__head">
            <h2 id="wod-game-title">Semaine {{ weekLabel }}</h2>
            <p>{{ game.word_length }} lettres · {{ remainingLabel }}</p>
            <p class="wod-game__validity">
              <i class="pi pi-calendar" aria-hidden="true"></i>
              <span>Mot valable jusqu’à dimanche soir. Prochain mot : {{ nextWordLabel }}.</span>
            </p>
          </div>

          <ol class="wod-board" :style="{ '--wod-length': game.word_length }" aria-label="Vos essais">
            <li
              v-for="(row, rowIndex) in rows"
              :key="rowIndex"
              class="wod-row"
              :class="{ 'is-current': row.kind === 'current', 'is-shaking': row.kind === 'current' && shaking }"
              :aria-label="row.label"
              :aria-current="row.kind === 'current' ? 'step' : undefined"
            >
              <span
                v-for="(cell, cellIndex) in row.cells"
                :key="cellIndex"
                class="wod-tile"
                :class="cell.mark ? `is-${cell.mark.key}` : { 'is-filled': cell.letter }"
                aria-hidden="true"
              >
                <span class="wod-tile__letter">{{ cell.letter }}</span>
                <i v-if="cell.mark" :class="['wod-tile__mark', cell.mark.icon]"></i>
              </span>
            </li>
          </ol>

          <p class="wod-message" :class="{ 'is-error': messageIsError }" role="status" aria-live="polite">{{ message }}</p>

          <section v-if="finished" class="wod-result" :class="`is-${game.status}`" aria-labelledby="wod-result-title">
            <h3 id="wod-result-title">
              <i :class="game.status === 'won' ? 'pi pi-check-circle' : 'pi pi-info-circle'" aria-hidden="true"></i>
              {{ game.status === 'won' ? `Trouvé en ${attemptsLabel(game.attempts.length)}` : 'Ce sera pour la semaine prochaine' }}
            </h3>
            <p v-if="game.xp_awarded > 0" class="wod-result__xp">
              +{{ game.xp_awarded }} XP pour vous et pour votre maison
            </p>
            <p v-else-if="game.status === 'won'" class="wod-result__xp">Mot trouvé. Aucun XP n’est attribué pour le moment.</p>
            <p class="wod-result__word">
              <span class="wod-result__label">Le mot de la semaine</span>
              <strong lang="fr">{{ game.solution?.word }}</strong>
            </p>
            <p class="wod-result__definition">{{ game.solution?.definition }}</p>
            <p v-if="game.solution?.theme" class="wod-result__theme">{{ game.solution.theme }}</p>
            <p class="wod-result__next">Un nouveau mot vous attend {{ nextWordLabel }}.</p>
          </section>

          <div v-else class="wod-keyboard" role="group" aria-label="Clavier du jeu">
            <div v-for="(keys, keyRow) in KEYBOARD_ROWS" :key="keys" class="wod-keyboard__row">
              <button
                v-if="keyRow === 2"
                type="button"
                class="wod-key wod-key--wide"
                :disabled="submitting"
                aria-label="Valider l’essai"
                @click="submit"
              >
                <i class="pi pi-check" aria-hidden="true"></i><span>Valider</span>
              </button>
              <button
                v-for="letter in keys"
                :key="letter"
                type="button"
                class="wod-key"
                :class="keyboardMarks[letter] ? `is-${MARKS[keyboardMarks[letter]].key}` : null"
                :disabled="submitting"
                :aria-label="keyboardMarks[letter] ? `${letter}, ${MARKS[keyboardMarks[letter]].label}` : letter"
                @click="type(letter)"
              >
                <span>{{ letter }}</span>
                <i v-if="keyboardMarks[letter]" :class="['wod-key__mark', MARKS[keyboardMarks[letter]].icon]" aria-hidden="true"></i>
              </button>
              <button
                v-if="keyRow === 2"
                type="button"
                class="wod-key wod-key--wide"
                :disabled="submitting"
                aria-label="Effacer la dernière lettre"
                @click="erase"
              >
                <i class="pi pi-delete-left" aria-hidden="true"></i><span>Effacer</span>
              </button>
            </div>
          </div>
        </section>

        <aside class="wod-side">
          <section class="wod-panel" aria-labelledby="wod-stats-title">
            <h2 id="wod-stats-title">Mon récapitulatif</h2>
            <dl class="wod-stats">
              <div><dt>Parties jouées</dt><dd>{{ stats.played }}</dd></div>
              <div><dt>Taux de réussite</dt><dd>{{ stats.win_rate }} %</dd></div>
              <div><dt>Série en cours</dt><dd>{{ weeksLabel(stats.current_streak) }}</dd></div>
              <div><dt>Meilleure série</dt><dd>{{ weeksLabel(stats.best_streak) }}</dd></div>
            </dl>
          </section>

          <section class="wod-panel" aria-labelledby="wod-rules-title">
            <h2 id="wod-rules-title">Comment jouer</h2>
            <p>Proposez un mot de {{ game.word_length }} lettres, sans accents. Après chaque essai, chaque lettre reçoit un indice :</p>
            <ul class="wod-legend">
              <li><span class="wod-tile wod-tile--small is-correct" aria-hidden="true"><span class="wod-tile__letter">A</span><i class="wod-tile__mark pi pi-check"></i></span>Bien placée</li>
              <li><span class="wod-tile wod-tile--small is-present" aria-hidden="true"><span class="wod-tile__letter">B</span><i class="wod-tile__mark pi pi-arrows-h"></i></span>Dans le mot, mais ailleurs</li>
              <li><span class="wod-tile wod-tile--small is-absent" aria-hidden="true"><span class="wod-tile__letter">C</span><i class="wod-tile__mark pi pi-times"></i></span>Absente du mot</li>
            </ul>
            <p class="wod-points">Une partie par semaine : vous pouvez la commencer et la reprendre quand vous voulez jusqu’à dimanche soir. 30 XP si vous trouvez le mot, 15 XP de plus en 3 essais ou moins. Les points comptent aussi pour votre maison.</p>
          </section>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Navbar from '@/components/common/utils/Navbar.vue'
import GamificationPageHeader from '@/components/gamification/GamificationPageHeader.vue'
import gamificationService from '@/service/gamificationServiceSupabase'
import {
  KEYBOARD_ROWS, MARKS, attemptsLabel, describeAttempt, letterStates, nextWordLabel as formatNextWord,
  normalizeLetter, weekRangeLabel, weeksLabel,
} from '@/components/games/word-of-day/wordOfDay'

const router = useRouter()

const phase = ref('loading')
const game = ref(null)
const draft = ref('')
const submitting = ref(false)
const shaking = ref(false)
const message = ref('')
const messageIsError = ref(false)

const finished = computed(() => game.value?.status === 'won' || game.value?.status === 'lost')
const stats = computed(() => ({
  played: 0, win_rate: 0, current_streak: 0, best_streak: 0, ...(game.value?.stats || {}),
}))
const keyboardMarks = computed(() => letterStates(game.value?.attempts))
// Lundi de la semaine en cours, fourni par le serveur (heure de Zurich).
const weekStart = computed(() => game.value?.week_start || game.value?.play_date || '')
const weekLabel = computed(() => weekRangeLabel(weekStart.value) || 'en cours')
const nextWordLabel = computed(() => formatNextWord(weekStart.value) || 'lundi prochain')
const remainingLabel = computed(() => {
  if (!game.value) return ''
  if (finished.value) return 'partie terminée'
  const remaining = game.value.max_attempts - game.value.attempts.length
  return remaining > 1 ? `${remaining} essais restants` : 'dernier essai'
})

const rows = computed(() => {
  const state = game.value
  if (!state) return []
  const length = state.word_length
  // Partie terminée : seuls les essais joués restent affichés, le résultat suit aussitôt.
  const visibleRows = finished.value ? state.attempts.length : state.max_attempts
  return Array.from({ length: visibleRows }, (_, index) => {
    const attempt = state.attempts[index]
    if (attempt) {
      return {
        kind: 'played',
        label: describeAttempt(attempt, index),
        cells: [...attempt.guess].map((letter, position) => ({ letter, mark: MARKS[attempt.feedback[position]] })),
      }
    }
    if (index === state.attempts.length && !finished.value) {
      const typed = draft.value ? `lettres saisies ${[...draft.value].join(' ')}` : 'aucune lettre saisie'
      return {
        kind: 'current',
        label: `Essai ${index + 1}, en cours : ${typed}`,
        cells: Array.from({ length }, (_, position) => ({ letter: draft.value[position] || '', mark: null })),
      }
    }
    return {
      kind: 'empty',
      label: `Essai ${index + 1} : pas encore joué`,
      cells: Array.from({ length }, () => ({ letter: '', mark: null })),
    }
  })
})

const say = (text, isError = false) => {
  message.value = text
  messageIsError.value = isError
}

const shake = () => {
  shaking.value = true
  window.setTimeout(() => { shaking.value = false }, 400)
}

const applyState = (state) => {
  if (!state?.eligible) {
    game.value = null
    phase.value = 'restricted'
    return
  }
  game.value = { ...state, attempts: state.attempts || [] }
  phase.value = 'ready'
}

const outcomeMessage = (state) => {
  if (state.status === 'won') {
    const gain = state.xp_awarded > 0 ? ` Vous gagnez ${state.xp_awarded} XP.` : ''
    return `Bravo, mot trouvé en ${attemptsLabel(state.attempts.length)} : ${state.solution?.word}.${gain}`
  }
  if (state.status === 'lost') return `Partie terminée. Le mot était ${state.solution?.word}.`
  const last = state.attempts.length - 1
  return `${describeAttempt(state.attempts[last], last)}.`
}

const load = async () => {
  phase.value = 'loading'
  try {
    applyState(await gamificationService.getMyWordOfDay())
    draft.value = ''
    if (phase.value !== 'ready') return
    if (finished.value) say(outcomeMessage(game.value))
    else if (game.value.attempts.length > 0) say(`Partie reprise : ${attemptsLabel(game.value.attempts.length)} déjà joué${game.value.attempts.length > 1 ? 's' : ''}.`)
    else say('Saisissez un mot, puis validez.')
  } catch (error) {
    console.error('Mot de la semaine : chargement impossible', error)
    phase.value = 'error'
  }
}

const type = (letter) => {
  if (phase.value !== 'ready' || finished.value || submitting.value) return
  if (draft.value.length >= game.value.word_length) return
  draft.value += letter
}

const erase = () => {
  if (phase.value !== 'ready' || finished.value || submitting.value) return
  draft.value = draft.value.slice(0, -1)
}

const submit = async () => {
  if (phase.value !== 'ready' || finished.value || submitting.value) return
  const missing = game.value.word_length - draft.value.length
  if (missing > 0) {
    say(missing > 1 ? `Il manque ${missing} lettres.` : 'Il manque 1 lettre.', true)
    shake()
    return
  }

  submitting.value = true
  const previousDate = game.value.play_date
  try {
    const state = await gamificationService.submitMyWordOfDayGuess(draft.value)
    applyState(state)
    draft.value = ''
    if (phase.value === 'ready') say(outcomeMessage(game.value))
  } catch (error) {
    console.error('Mot de la semaine : essai refusé', error)
    // Le serveur fait foi : on relit la partie (mot changé lundi à minuit, partie déjà terminée…).
    try {
      applyState(await gamificationService.getMyWordOfDay())
      if (phase.value === 'ready' && game.value.play_date !== previousDate) {
        draft.value = ''
        say('Un nouveau mot de la semaine est disponible. La partie recommence.', true)
      } else if (phase.value === 'ready' && finished.value) {
        draft.value = ''
        say(outcomeMessage(game.value))
      } else if (phase.value === 'ready') {
        say('Cet essai n’a pas pu être validé. Utilisez uniquement des lettres, puis réessayez.', true)
        shake()
      }
    } catch (reloadError) {
      console.error('Mot de la semaine : relecture impossible', reloadError)
      say('Cet essai n’a pas pu être validé. Vérifiez votre connexion, puis réessayez.', true)
    }
  } finally {
    submitting.value = false
  }
}

const focusedByKeyboard = (element) => {
  try {
    return element.matches(':focus-visible')
  } catch {
    return true
  }
}

const onKeydown = (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented) return
  const target = event.target instanceof HTMLElement ? event.target : null
  if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return
  if (phase.value !== 'ready' || finished.value) return

  if (event.key === 'Enter') {
    // Sur un bouton ou un lien atteint au clavier, Entrée garde son rôle habituel.
    // Après un clic sur une touche du jeu, Entrée valide l'essai.
    const control = target?.closest('button, a, [role="button"]')
    if (control && (!control.classList.contains('wod-key') || focusedByKeyboard(control))) return
    event.preventDefault()
    submit()
  } else if (event.key === 'Backspace') {
    event.preventDefault()
    erase()
  } else {
    const letter = normalizeLetter(event.key)
    if (letter) type(letter)
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  load()
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.wod-root { min-height: 100vh; padding-top: 20px; background: none; }
.wod-content { max-width: 1200px; margin: 0 auto; padding: 2.5rem 1.2rem; }

:deep(.game-header) { color: var(--text-color); background: var(--surface-card); border-color: var(--surface-border); box-shadow: none; }
:deep(.game-header h1) { color: var(--text-color); }
:deep(.game-header__description) { color: var(--text-color-secondary); }
:deep(.game-header__back) { color: var(--text-color); border-color: var(--surface-border); }

.wod-layout { display: grid; grid-template-columns: minmax(0, 1fr) 20rem; gap: 1.25rem; align-items: start; }
.wod-side { display: grid; gap: 1.25rem; }

.wod-panel {
  padding: 1.25rem;
  border: 1px solid var(--surface-border, #294360);
  border-radius: 16px;
  background: var(--surface-card, #07182d);
  color: var(--text-color, #f7f9fc);
}
.wod-panel h2 { margin: 0 0 .75rem; font-size: 1.15rem; line-height: 1.3; }
.wod-panel p { margin: 0 0 .75rem; color: var(--text-color-secondary, #b8c7d9); line-height: 1.5; }
.wod-panel p:last-child { margin-bottom: 0; }

.wod-center { display: grid; gap: .5rem; justify-items: start; padding: clamp(1.25rem, 4vw, 2.5rem); }
.wod-center > i { color: var(--primary-color, #f3c300); font-size: 1.5rem; }
.wod-center h2 { margin: .5rem 0 0; }
.wod-primary { min-height: 44px; background: #f3c300; border-color: #f3c300; color: #071426; }
.wod-primary:hover { background: #ffdb48; border-color: #ffdb48; color: #071426; }

.wod-game { display: grid; gap: 1rem; justify-items: center; }
.wod-game__head { width: 100%; }
.wod-game__head h2 { margin-bottom: .2rem; }
.wod-game__head p { margin: 0; font-variant-numeric: tabular-nums; }
.wod-game__head .wod-game__validity { display: flex; gap: .45rem; align-items: baseline; margin-top: .45rem; color: var(--text-color-secondary, #b8c7d9); line-height: 1.45; }

.wod-board {
  display: grid;
  gap: .4rem;
  width: min(100%, calc(var(--wod-length) * 4.1rem));
  margin: 0;
  padding: 0;
  list-style: none;
}
.wod-row { display: grid; grid-template-columns: repeat(var(--wod-length), minmax(0, 1fr)); gap: .4rem; }

.wod-tile {
  position: relative;
  display: grid;
  aspect-ratio: 1;
  place-items: center;
  border: 2px solid var(--surface-border, #294360);
  border-radius: 10px;
  background: var(--surface-ground, #132b47);
  color: var(--text-color, #f7f9fc);
  font-size: clamp(.8rem, calc(34vw / var(--wod-length, 5)), 1.5rem);
  font-weight: 800;
  line-height: 1;
  text-transform: uppercase;
  transition: background-color .2s ease, border-color .2s ease, color .2s ease;
}
.wod-row.is-current .wod-tile { border-color: color-mix(in srgb, var(--primary-color, #f3c300) 45%, var(--surface-border, #294360)); }
.wod-tile.is-filled { border-color: var(--text-color-secondary, #b8c7d9); }
.wod-tile__mark {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: .42em;
}

/* Bien placée : plein. Mal placée : contour en tirets. Absente : estompée. Chaque état a aussi son icône. */
.wod-tile.is-correct, .wod-key.is-correct { border-color: var(--brand-green, #3ecf8e); background: var(--brand-green, #3ecf8e); color: #071426; }
.wod-tile.is-present, .wod-key.is-present { border-style: dashed; border-color: var(--brand-yellow, #f3c300); background: color-mix(in srgb, var(--brand-yellow, #f3c300) 14%, transparent); color: var(--text-color, #f7f9fc); }
.wod-tile.is-absent, .wod-key.is-absent { border-color: transparent; background: color-mix(in srgb, var(--text-color-secondary, #b8c7d9) 14%, transparent); color: var(--text-color-secondary, #b8c7d9); }

.wod-row.is-shaking { animation: wod-shake .4s ease; }
@keyframes wod-shake {
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}

.wod-message { min-height: 1.5em; margin: 0; color: var(--text-color-secondary, #b8c7d9); text-align: center; line-height: 1.5; }
.wod-message.is-error { color: var(--text-color, #f7f9fc); font-weight: 700; }

.wod-keyboard { display: grid; gap: .4rem; width: min(100%, 34rem); touch-action: manipulation; }
.wod-keyboard__row { display: flex; gap: .3rem; justify-content: center; }
.wod-key {
  position: relative;
  display: inline-flex;
  flex: 1 1 0;
  gap: .3rem;
  align-items: center;
  justify-content: center;
  min-width: 0;
  max-width: 3rem;
  min-height: 48px;
  padding: 0;
  border: 2px solid var(--surface-border, #294360);
  border-radius: 8px;
  background: var(--surface-ground, #132b47);
  color: var(--text-color, #f7f9fc);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: background-color .15s ease, transform .1s ease;
}
.wod-key:active:not(:disabled) { transform: scale(.96); }
.wod-key:disabled { cursor: default; opacity: .6; }
.wod-key--wide { flex: 1.9 1 0; max-width: 6.5rem; padding: 0 .4rem; font-size: .85rem; }
.wod-key__mark { position: absolute; top: 2px; right: 2px; font-size: .5rem; }
.wod-key:focus-visible, :deep(button:focus-visible) { outline: 3px solid var(--primary-color, #f3c300); outline-offset: 2px; }

.wod-result { width: min(100%, 34rem); padding: 1rem 1.1rem; border: 1px solid var(--surface-border, #294360); border-radius: 12px; background: var(--surface-ground, #132b47); }
.wod-result.is-won { border-color: var(--brand-green, #3ecf8e); }
.wod-result h3 { display: flex; gap: .5rem; align-items: center; margin: 0 0 .6rem; font-size: 1.15rem; }
.wod-result.is-won h3 i { color: var(--brand-green, #3ecf8e); }
.wod-result p { margin: 0 0 .6rem; }
.wod-result .wod-result__xp { color: var(--text-color, #f7f9fc); font-weight: 700; }
.wod-result__word { display: grid; gap: .15rem; }
.wod-result__label { font-size: .8rem; text-transform: uppercase; letter-spacing: .06em; }
.wod-result__word strong { color: var(--text-color, #f7f9fc); font-size: 1.6rem; line-height: 1.2; }
.wod-result .wod-result__definition { color: var(--text-color, #f7f9fc); }
.wod-result__theme { font-size: .875rem; }

.wod-stats { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; margin: 0; }
.wod-stats div { padding: .7rem .8rem; border-radius: 10px; background: var(--surface-ground, #132b47); }
.wod-stats dt { color: var(--text-color-secondary, #b8c7d9); font-size: .8rem; }
.wod-stats dd { margin: .2rem 0 0; font-size: 1.25rem; font-weight: 800; font-variant-numeric: tabular-nums; }

.wod-legend { display: grid; gap: .5rem; margin: 0 0 .9rem; padding: 0; list-style: none; }
.wod-legend li { display: flex; gap: .6rem; align-items: center; }
.wod-tile--small { width: 2.1rem; flex: 0 0 2.1rem; font-size: .95rem; }

@media (max-width: 900px) {
  .wod-layout { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  .wod-root { padding-top: 0; }
  .wod-content { padding: 1rem .75rem 2rem; }
  /* Sur téléphone, la grille et le clavier tiennent ensemble à l'écran. */
  :deep(.game-header) { margin-bottom: .75rem; padding: .85rem; gap: .75rem; }
  :deep(.game-header__description) { display: none; }
  .wod-game { gap: .75rem; }
  .wod-tile__mark { top: 2px; right: 2px; font-size: .45rem; }
  .wod-tile--small .wod-tile__mark { font-size: .5rem; }
  .wod-panel { padding: 1rem .75rem; }
  .wod-board, .wod-row { gap: .25rem; }
  .wod-tile { border-radius: 8px; }
  .wod-keyboard__row { gap: .2rem; }
  .wod-key--wide span { display: none; }
  .wod-key--wide { font-size: 1rem; }
}

@media (prefers-reduced-motion: reduce) {
  .wod-tile, .wod-key { transition: none; }
  .wod-row.is-shaking { animation: none; }
  .wod-key:active:not(:disabled) { transform: none; }
}
</style>
