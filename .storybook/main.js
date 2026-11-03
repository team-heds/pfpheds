/** @type { import('@storybook/vue3-vite').StorybookConfig } */
const config = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  async viteFinal(config) {
    const appOnlyPlugins = ['pwa', 'vue-devtools', 'unplugin-vue-components', 'presentation-dev-assets']

    return {
      ...config,
      publicDir: false,
      plugins: config.plugins?.flat(Infinity).filter((plugin) => {
        const name = plugin?.name || ''
        return !appOnlyPlugins.some((appPlugin) => name.includes(appPlugin))
      }),
    }
  },
}

export default config
