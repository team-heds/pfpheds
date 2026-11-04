const normalize = (value) => String(value ?? '').trim().toUpperCase()

function canReadAssignmentCounts({ admin = false, userId, profile, sessions }) {
  if (admin) return true
  if (!userId) return false

  const studentClasses = new Set(
    [profile?.classe, profile?.pfp_cohort].map(normalize).filter(Boolean)
  )

  return (Array.isArray(sessions) ? sessions : []).some((session) => {
    if (session?.is_priority) {
      return (Array.isArray(session.priority_user_ids) ? session.priority_user_ids : [])
        .some((id) => String(id) === String(userId))
    }
    return studentClasses.has(normalize(session?.target_class))
  })
}

module.exports = { canReadAssignmentCounts }
