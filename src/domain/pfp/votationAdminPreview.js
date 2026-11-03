export function canPreviewVotation(user, roleStore) {
  return Boolean(user?.id && roleStore?.can('admin'))
}

export function selectPreviewSession(sessions, selectedId) {
  const open = (sessions || []).filter((session) => session.status === 'open')
  return open.find((session) => session.id === selectedId) || open[0] || null
}
