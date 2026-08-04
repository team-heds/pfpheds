import apiClient from '@/service/apiClient'

export async function getBranchSHA() {
  throw new Error('Branch references are resolved by the backend.')
}

export async function createBranch(repoUrl, branchName, baseBranch = 'main') {
  try {
    const { data } = await apiClient.post('/integrations/github/branches', { repoUrl, branchName, baseBranch })
    return data
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message }
  }
}

export async function listBranches(repoUrl) {
  const { data } = await apiClient.get('/integrations/github/branches', { params: { repoUrl } })
  return data || []
}

export async function createPullRequest(repoUrl, title, headBranch, baseBranch, body) {
  try {
    const { data } = await apiClient.post('/integrations/github/pull-requests', {
      repoUrl, title, headBranch, baseBranch, body,
    })
    return data
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message }
  }
}

export async function verifyToken() {
  try {
    const { data } = await apiClient.get('/integrations/github/status')
    return data
  } catch (error) {
    return { valid: false, error: error.response?.data?.error || error.message }
  }
}

export function getGitHubToken() {
  return 'server-managed'
}

export function setGitHubToken() {
  // Credentials are configured server-side and are never persisted in the browser.
}

export default {
  createBranch,
  listBranches,
  createPullRequest,
  verifyToken,
  getBranchSHA,
  getGitHubToken,
  setGitHubToken,
}
