import { defineAsyncComponent, defineComponent, h } from 'vue'

/**
 * Page chargée seulement quand elle s'affiche.
 *
 * Le routeur télécharge les pages déclarées `() => import(...)` dès la
 * navigation, même quand rien ne les affiche. Sur téléphone, l'application
 * mobile remplace certaines pages d'ordinateur (fil, institutions, carte,
 * profil) : sans ce cadre, chaque ouverture téléchargeait aussi ces pages,
 * leurs colonnes latérales et leurs dépendances. Les paramètres de la route
 * sont transmis tels quels à la page.
 */
export function loadWhenShown(loader, name = 'Page') {
  const Page = defineAsyncComponent(() => loader().then((module) => module.default))
  return defineComponent({
    name: `${name}WhenShown`,
    inheritAttrs: false,
    setup(_props, { attrs }) {
      return () => h(Page, attrs)
    },
  })
}
