import SharedStudentFollowUp from './SharedStudentFollowUp.vue'

export default {
  title: 'Administration/Cas particuliers par étudiant',
  component: SharedStudentFollowUp,
  parameters: { layout: 'padded' }
}

export const AvecSuivi = {
  args: {
    student: {
      info_etudiant: { commentaire: 'Remarques\nExemple fictif pour vérifier l’affichage.\n\nSuivi LPP\nUn entretien de suivi est prévu.' },
      pfp1: { commentaire: 'Premier stage : suivi pédagogique.' },
      pfp1_prime: { commentaire: 'Deuxième période : objectifs à revoir.' },
      sae: { commentaire: 'Aménagement à confirmer.' }
    }
  }
}

export const SansCommentaire = { args: { student: {} } }

export const CasParticuliersSansDoublonSAE = {
  args: {
    title: 'Autres cas particuliers',
    excludedFields: ['sae'],
    student: AvecSuivi.args.student
  }
}
