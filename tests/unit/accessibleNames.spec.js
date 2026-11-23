import { readFileSync, readdirSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import process from 'node:process'
import { parse } from '@vue/compiler-sfc'
import { describe, expect, it } from 'vitest'
import { primevueLocaleFr } from '@/config/primevueLocaleFr'

const root = process.cwd()
const vueFiles = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const path = join(directory, entry.name)
  if (entry.isDirectory()) return vueFiles(path)
  return entry.name.endsWith('.vue') ? [path] : []
})

const NAME_PROPS = ['aria-label', 'ariaLabel', 'aria-labelledby', 'ariaLabelledby', 'title', 'label']
const hasProp = (node, name) => node.props.some((prop) => (
  (prop.type === 6 && prop.name === name) || (prop.type === 7 && prop.name === 'bind' && prop.arg?.content === name)
))
const spreadsProps = (node) => node.props.some((prop) => prop.type === 7 && prop.name === 'bind' && !prop.arg)
const hasTooltip = (node) => node.props.some((prop) => prop.type === 7 && prop.name === 'tooltip')
const hasContent = (node) => (node.children || []).some((child) => child.type !== 3 && !(child.type === 2 && !child.content.trim()))

const walk = (node, visit) => {
  if (node.type === 1) visit(node)
  for (const child of node.children || []) walk(child, visit)
  for (const branch of node.branches || []) walk(branch, visit)
}

describe('noms accessibles', () => {
  it('nomme chaque bouton PrimeVue qui n’affiche qu’une icône', () => {
    const unnamed = []
    for (const file of vueFiles(resolve(root, 'src'))) {
      const { descriptor } = parse(readFileSync(file, 'utf8'), { filename: file })
      if (!descriptor.template?.ast) continue
      walk(descriptor.template.ast, (node) => {
        if (node.tag !== 'Button' || !hasProp(node, 'icon') || hasContent(node) || spreadsProps(node) || hasTooltip(node)) return
        if (!NAME_PROPS.some((name) => hasProp(node, name))) unnamed.push(`${relative(root, file)}:${node.loc.start.line}`)
      })
    }
    expect(unnamed).toEqual([])
  })

  it('traduit les libellés internes de PrimeVue', () => {
    expect(primevueLocaleFr.aria.selectRow).toBe('Sélectionner la ligne')
    expect(primevueLocaleFr.aria.selectAll).toBe('Tout sélectionner')
    expect(primevueLocaleFr.aria.nextPageLabel).toBe('Page suivante')
    expect(primevueLocaleFr.showFilterMenu).toBeTruthy()
    expect(primevueLocaleFr.hideFilterMenu).toBeTruthy()
  })
})
