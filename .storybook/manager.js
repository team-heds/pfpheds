import { addons } from 'storybook/manager-api'
import { create } from 'storybook/theming/create'
import hedsLogo from '../src/assets/images/FR-DE_HEdS_rvb_neg.png'

addons.setConfig({
  theme: create({
    base: 'dark',
    brandTitle: 'Interface HEdS',
    brandUrl: '/',
    brandImage: hedsLogo,
    brandTarget: '_self',
    colorPrimary: '#F3C300',
    colorSecondary: '#F3C300',
    appBg: '#071426',
    appContentBg: '#0B213F',
    appPreviewBg: '#0B213F',
    appBorderColor: '#263A55',
    appBorderRadius: 8,
    textColor: 'rgba(255, 255, 255, 0.87)',
    textMutedColor: '#AAB6C5',
    barTextColor: '#DDE5EF',
    barSelectedColor: '#F3C300',
    barHoverColor: '#FFFFFF',
    barBg: '#071426',
    inputBg: '#0B213F',
    inputBorder: '#3A4C64',
    inputTextColor: '#FFFFFF',
    inputBorderRadius: 8,
    fontBase: 'Poppins, sans-serif',
  }),
})
