import { config } from '@vue/test-utils'
import { vi } from 'vitest'

const firebaseMock = vi.hoisted(() => ({
  db: {},
  auth: {},
  storage: {},
  firebaseConfig: {},
  getUserNameById: vi.fn()
}))

vi.mock('../firebase.js', () => firebaseMock)
vi.mock('../src/firebase.js', () => firebaseMock)
vi.mock('@/firebase', () => firebaseMock)
vi.mock('@/firebase.js', () => firebaseMock)
vi.mock('root/firebase.js', () => firebaseMock)

config.global.stubs = {
  AdminLayout: { template: '<div><slot /><slot name="header" /></div>' },
  PageHeader: { template: '<div />' },
  Card: { template: '<div><slot /><slot name="header" /><slot name="content" /><slot name="footer" /></div>' },
  Dialog: { template: '<div><slot /><slot name="footer" /></div>' },
  Button: { template: '<button><slot /></button>' },
  Dropdown: { template: '<div><slot /></div>', props: ['options', 'modelValue'] },
  AutoComplete: { template: '<input />' },
  DataTable: { template: '<div><slot /></div>' },
  Column: { template: '<div><slot /></div>' },
  Tag: { template: '<span><slot /></span>' },
  Badge: { template: '<span><slot /></span>' },
  Chip: { template: '<span><slot /></span>' },
  InputText: { template: '<input />' },
  InputNumber: { template: '<input />' },
  Textarea: { template: '<textarea />' },
  Toast: { template: '<div />' },
  ProgressSpinner: { template: '<div />' },
  ConfirmDialog: { template: '<div />' },
  Calendar: { template: '<input />' }
}

config.global.directives = {
  tooltip: () => {}
}

if (!window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {}
  })
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
