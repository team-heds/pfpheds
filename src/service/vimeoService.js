import apiClient from '@/service/apiClient'

export async function listAllVideos({ perPage = 50, maxPages = 10, query = '' } = {}) {
  const { data } = await apiClient.get('/integrations/vimeo/videos', {
    params: { perPage, maxPages, query },
  })
  return data || []
}

export function buildEmbedUrl(vimeoId, params = {}) {
  const url = new URL(`https://player.vimeo.com/video/${vimeoId}`)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value))
  })
  return url.toString()
}

export async function getVideoMeta(vimeoId) {
  const { data } = await apiClient.get(`/integrations/vimeo/videos/${encodeURIComponent(vimeoId)}`)
  return data
}

export async function verifyDomainPrivacy(vimeoId, domain) {
  const video = await getVideoMeta(vimeoId)
  const allowedDomains = video?.domains || []
  return {
    allowed: allowedDomains.length === 0 || allowedDomains.includes(domain),
    domains: allowedDomains,
    privacy: video?.privacy,
  }
}

export async function testVimeoAuth() {
  try {
    const { data } = await apiClient.get('/integrations/vimeo/auth-test')
    return data
  } catch (error) {
    return { ok: false, error: error.response?.data?.error || error.message }
  }
}
