/**
 * Service d'intégration avec l'API GitHub
 * Documentation: https://docs.github.com/en/rest
 */

const GITHUB_API_BASE = 'https://api.github.com'

/**
 * Parse une URL GitHub pour extraire owner et repo
 * @param {string} repoUrl - URL du repository (https://github.com/owner/repo)
 * @returns {Object} { owner, repo }
 */
function parseGitHubUrl(repoUrl) {
  try {
    const url = new URL(repoUrl)
    const parts = url.pathname.split('/').filter(Boolean)
    
    if (parts.length >= 2) {
      return {
        owner: parts[0],
        repo: parts[1].replace('.git', '')
      }
    }
    
    throw new Error('URL GitHub invalide')
  } catch (error) {
    console.error('[githubService] Erreur parsing URL:', error)
    throw new Error('Format d\'URL GitHub invalide')
  }
}

/**
 * Effectue une requête à l'API GitHub
 * @param {string} endpoint - Endpoint de l'API
 * @param {Object} options - Options fetch
 * @param {string} token - GitHub Personal Access Token
 * @returns {Promise}
 */
async function githubRequest(endpoint, options = {}, token) {
  const url = `${GITHUB_API_BASE}${endpoint}`
  
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    ...options.headers
  }
  
  // Ajouter le token si fourni
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const response = await fetch(url, {
    ...options,
    headers
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `GitHub API Error: ${response.status}`)
  }
  
  return response.json()
}

/**
 * Récupère le SHA du dernier commit d'une branche
 * @param {string} owner - Propriétaire du repo
 * @param {string} repo - Nom du repo
 * @param {string} branch - Nom de la branche
 * @param {string} token - GitHub token
 * @returns {Promise<string>} SHA du commit
 */
export async function getBranchSHA(owner, repo, branch, token) {
  try {
    const data = await githubRequest(
      `/repos/${owner}/${repo}/git/ref/heads/${branch}`,
      {},
      token
    )
    
    const sha = data.object.sha
    return sha
  } catch (error) {
    console.error('[githubService] ❌ Erreur getBranchSHA:', error)
    throw error
  }
}

/**
 * Crée une nouvelle branche sur GitHub
 * @param {string} repoUrl - URL du repository
 * @param {string} branchName - Nom de la nouvelle branche
 * @param {string} baseBranch - Branche de base (default: 'main')
 * @param {string} token - GitHub Personal Access Token
 * @returns {Promise<Object>} Informations sur la branche créée
 */
export async function createBranch(repoUrl, branchName, baseBranch = 'main', token) {
  try {
    if (!token) {
      throw new Error('GitHub token manquant. Configurez-le dans les paramètres.')
    }
    
    // Parser l'URL
    const { owner, repo } = parseGitHubUrl(repoUrl)
    
    // 1. Récupérer le SHA de la branche de base
    const sha = await getBranchSHA(owner, repo, baseBranch, token)
    
    // 2. Créer la nouvelle branche
    const data = await githubRequest(
      `/repos/${owner}/${repo}/git/refs`,
      {
        method: 'POST',
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: sha
        })
      },
      token
    )
    
    return {
      success: true,
      branch: branchName,
      url: `https://github.com/${owner}/${repo}/tree/${branchName}`,
      ref: data.ref,
      sha: data.object.sha
    }
  } catch (error) {
    console.error('[githubService] ❌ Erreur createBranch:', error)
    
    // Gérer les erreurs spécifiques
    if (error.message.includes('Reference already exists')) {
      throw new Error(`La branche "${branchName}" existe déjà sur GitHub`)
    } else if (error.message.includes('Not Found')) {
      throw new Error('Repository introuvable ou token invalide')
    } else if (error.message.includes('Bad credentials')) {
      throw new Error('Token GitHub invalide')
    }
    
    throw error
  }
}

/**
 * Liste toutes les branches d'un repository
 * @param {string} repoUrl - URL du repository
 * @param {string} token - GitHub token
 * @returns {Promise<Array>} Liste des branches
 */
export async function listBranches(repoUrl, token) {
  try {
    const { owner, repo } = parseGitHubUrl(repoUrl)
    
    const branches = await githubRequest(
      `/repos/${owner}/${repo}/branches`,
      {},
      token
    )
    
    return branches.map(b => ({
      name: b.name,
      sha: b.commit.sha,
      protected: b.protected
    }))
  } catch (error) {
    console.error('[githubService] Erreur listBranches:', error)
    throw error
  }
}

/**
 * Crée une Pull Request sur GitHub
 * @param {string} repoUrl - URL du repository
 * @param {string} title - Titre de la PR
 * @param {string} headBranch - Branche source
 * @param {string} baseBranch - Branche de destination
 * @param {string} body - Description de la PR
 * @param {string} token - GitHub token
 * @returns {Promise<Object>} Informations sur la PR
 */
export async function createPullRequest(repoUrl, title, headBranch, baseBranch, body, token) {
  try {
    const { owner, repo } = parseGitHubUrl(repoUrl)
    
    const pr = await githubRequest(
      `/repos/${owner}/${repo}/pulls`,
      {
        method: 'POST',
        body: JSON.stringify({
          title,
          head: headBranch,
          base: baseBranch,
          body,
          draft: false
        })
      },
      token
    )
    
    return {
      success: true,
      number: pr.number,
      url: pr.html_url,
      state: pr.state
    }
  } catch (error) {
    console.error('[githubService] Erreur createPullRequest:', error)
    throw error
  }
}

/**
 * Vérifie si le token GitHub est valide
 * @param {string} token - GitHub token
 * @returns {Promise<Object>} Informations sur l'utilisateur
 */
export async function verifyToken(token) {
  try {
    const user = await githubRequest('/user', {}, token)
    
    return {
      valid: true,
      username: user.login,
      name: user.name,
      avatar: user.avatar_url
    }
  } catch (error) {
    console.error('[githubService] Token invalide:', error)
    return {
      valid: false,
      error: error.message
    }
  }
}

/**
 * Récupère le token GitHub depuis le localStorage
 * @returns {string|null} Token ou null
 */
export function getGitHubToken() {
  return localStorage.getItem('github_token')
}

/**
 * Sauvegarde le token GitHub dans le localStorage
 * @param {string} token - Token à sauvegarder
 */
export function setGitHubToken(token) {
  if (token) {
    localStorage.setItem('github_token', token)
  } else {
    localStorage.removeItem('github_token')
  }
}

export default {
  createBranch,
  listBranches,
  createPullRequest,
  verifyToken,
  getBranchSHA,
  getGitHubToken,
  setGitHubToken
}
