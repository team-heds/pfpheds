export function initCopyCode() {
  document.querySelectorAll('pre').forEach((pre) => {
    if (pre.querySelector('.copy-code-button')) return

    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'copy-code-button'
    button.textContent = 'Copier'
    button.setAttribute('aria-label', 'Copier la commande')

    button.addEventListener('click', async () => {
      const code = pre.querySelector('code')?.innerText ?? ''
      await navigator.clipboard.writeText(code)
      button.textContent = 'Copié'
      button.classList.add('is-copied')
      window.setTimeout(() => {
        button.textContent = 'Copier'
        button.classList.remove('is-copied')
      }, 1600)
    })

    pre.appendChild(button)
  })
}
