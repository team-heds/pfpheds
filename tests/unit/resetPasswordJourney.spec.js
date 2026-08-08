import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const recovery = vi.hoisted(() => ({
  resolveFromLocation: vi.fn(),
  authorizeWithOtp: vi.fn(),
  updatePassword: vi.fn(),
  abandon: vi.fn(),
}))

const routerPush = vi.hoisted(() => vi.fn())

vi.mock('@/supabase.js', () => ({
  supabase: { auth: {} },
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerPush }),
}))

vi.mock('@/service/passwordRecoveryService', () => ({
  PASSWORD_RECOVERY_ERROR_CODES: {
    INVALID_CONTEXT: 'recovery_context_invalid',
    ALREADY_CONSUMED: 'recovery_context_consumed',
    UPDATE_IN_PROGRESS: 'recovery_update_in_progress',
  },
  createPasswordRecoveryService: () => recovery,
}))

import ResetPassword from '@/views/pages/ResetPassword.vue'

const ButtonStub = {
  props: ['label', 'type', 'disabled', 'loading'],
  emits: ['click'],
  template: '<button :type="type || \'button\'" :disabled="disabled" @click="$emit(\'click\')">{{ label }}</button>',
}

const InputStub = {
  inheritAttrs: false,
  props: ['modelValue', 'id', 'type', 'name', 'inputProps'],
  emits: ['update:modelValue', 'blur'],
  template: `
    <input
      v-bind="{ ...$attrs, ...inputProps }"
      :id="id"
      :type="type || 'text'"
      :name="name || inputProps?.name"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      @blur="$emit('blur')"
    />
  `,
}

const InlineMessageStub = {
  template: '<div role="alert"><slot /></div>',
}

async function mountJourney(result) {
  recovery.resolveFromLocation.mockResolvedValueOnce(result)
  const wrapper = mount(ResetPassword, {
    global: {
      stubs: {
        Button: ButtonStub,
        InputText: InputStub,
        Password: InputStub,
        InlineMessage: InlineMessageStub,
      },
    },
  })
  await flushPromises()
  return wrapper
}

describe('parcours complet de réinitialisation du mot de passe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    recovery.authorizeWithOtp.mockResolvedValue(undefined)
    recovery.updatePassword.mockResolvedValue(undefined)
    recovery.abandon.mockResolvedValue(undefined)
  })

  it('présente un état contrôlé pour un jeton expiré et accepte le dernier code reçu', async () => {
    const wrapper = await mountJourney({ status: 'invalid', reason: 'expired' })

    expect(wrapper.get('[role="alert"]').text()).toContain('Lien expiré')

    await wrapper.get('#codeEmail').setValue('student@example.ch')
    await wrapper.get('#codeToken').setValue('123456')
    await wrapper.get('form.code-form').trigger('submit')
    await flushPromises()

    expect(recovery.authorizeWithOtp).toHaveBeenCalledWith('student@example.ch', '123456')
    expect(wrapper.find('form.password-form').exists()).toBe(true)
  })

  it('refuse des mots de passe différents sans appeler Supabase', async () => {
    const wrapper = await mountJourney({ status: 'valid' })

    await wrapper.get('#pwd1').setValue('Nouveau!2026')
    await wrapper.get('#pwd2').setValue('Different!2026')
    await wrapper.get('form.password-form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Les deux mots de passe doivent être identiques.')
    expect(recovery.updatePassword).not.toHaveBeenCalled()
  })

  it('refuse un mot de passe non conforme sans appeler Supabase', async () => {
    const wrapper = await mountJourney({ status: 'valid' })

    await wrapper.get('#pwd1').setValue('password')
    await wrapper.get('#pwd2').setValue('password')
    await wrapper.get('form.password-form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Règle manquante')
    expect(recovery.updatePassword).not.toHaveBeenCalled()
  })

  it('termine le parcours avec un mot de passe robuste puis revient à la connexion', async () => {
    const wrapper = await mountJourney({ status: 'valid' })

    await wrapper.get('#pwd1').setValue('Nouveau!2026')
    await wrapper.get('#pwd2').setValue('Nouveau!2026')
    await wrapper.get('form.password-form').trigger('submit')
    await flushPromises()

    expect(recovery.updatePassword).toHaveBeenCalledWith('Nouveau!2026')
    expect(wrapper.text()).toContain('Mot de passe modifié')

    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(routerPush).toHaveBeenCalledWith('/')
  })

  it('explique qu’un jeton déjà consommé exige un nouvel email', async () => {
    recovery.updatePassword.mockRejectedValueOnce({ code: 'recovery_context_consumed' })
    const wrapper = await mountJourney({ status: 'valid' })

    await wrapper.get('#pwd1').setValue('Nouveau!2026')
    await wrapper.get('#pwd2').setValue('Nouveau!2026')
    await wrapper.get('form.password-form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('a déjà été utilisé')
    expect(wrapper.find('form.password-form').exists()).toBe(true)
  })
})
