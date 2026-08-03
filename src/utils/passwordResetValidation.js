export const PASSWORD_RULES = [
  {
    id: 'length',
    label: 'Au moins 8 caractères',
    test: password => typeof password === 'string' && password.length >= 8,
  },
  {
    id: 'uppercase',
    label: 'Une lettre majuscule',
    test: password => /[A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ]/.test(password || ''),
  },
  {
    id: 'lowercase',
    label: 'Une lettre minuscule',
    test: password => /[a-zàâäçéèêëîïôöùûüÿ]/.test(password || ''),
  },
  {
    id: 'number',
    label: 'Un chiffre',
    test: password => /\d/.test(password || ''),
  },
  {
    id: 'special',
    label: 'Un caractère spécial',
    test: password => /[^A-Za-zÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸàâäçéèêëîïôöùûüÿ0-9\s]/.test(password || ''),
  },
]

export function getPasswordRuleStates(password) {
  return PASSWORD_RULES.map(rule => ({
    id: rule.id,
    label: rule.label,
    valid: rule.test(password),
  }))
}

export function validateNewPassword(password, confirmation) {
  const ruleStates = getPasswordRuleStates(password)
  const missingRule = ruleStates.find(rule => !rule.valid)

  if (!password) {
    return {
      valid: false,
      message: 'Le mot de passe est requis.',
      ruleStates,
    }
  }

  if (missingRule) {
    return {
      valid: false,
      message: `Règle manquante : ${missingRule.label.toLowerCase()}.`,
      ruleStates,
    }
  }

  if (!confirmation) {
    return {
      valid: false,
      message: 'La confirmation du mot de passe est requise.',
      ruleStates,
    }
  }

  if (password !== confirmation) {
    return {
      valid: false,
      message: 'Les deux mots de passe doivent être identiques.',
      ruleStates,
    }
  }

  return {
    valid: true,
    message: '',
    ruleStates,
  }
}
