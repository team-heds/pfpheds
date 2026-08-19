# Système partagé de formulaires

Utiliser ces primitives pour tout nouveau formulaire et lors de la modification d’un formulaire existant.

- `FormShell` structure la page et expose `aria-busy` pendant une opération.
- `FormSection` regroupe les champs liés dans un `fieldset` natif.
- `FormField` relie le label, l’aide, l’erreur et le succès au contrôle. Appliquer `v-bind="field.controlAttrs"` au composant PrimeVue ou au contrôle natif.
- `FormStatus` affiche et annonce les états chargement, succès et échec.
- `FormActions` aligne les actions, peut rester visible et annonce l’état de la sauvegarde.

```vue
<FormField
  for-id="email"
  label="Email"
  required
  hint="Utilisez votre adresse institutionnelle."
  :error="errors.email"
  v-slot="field"
>
  <InputText v-bind="field.controlAttrs" v-model="form.email" type="email" />
</FormField>
```

Les actions principales doivent être de vrais boutons `type="submit"` associés au formulaire. Les actions d’annulation utilisent `type="button"`. Ne pas transmettre une erreur uniquement avec un toast : conserver aussi un `FormStatus` ou une erreur liée au champ.
