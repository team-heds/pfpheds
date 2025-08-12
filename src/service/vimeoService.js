// Vimeo Service
// Reads the API token from VITE_VIMEO_ACCESS_TOKEN; do not commit secrets.
// Only uses public-safe endpoints from the client. Prefer a server/edge proxy for private scopes.

const VIMEO_API_BASE = 'https://api.vimeo.com';

function getToken() {
  // Allow a localStorage override for development/debug
  const override = typeof window !== 'undefined' ? window.localStorage?.getItem('VIMEO_TOKEN_OVERRIDE') : null;
  if (override) {
    console.log('[vimeoService] Using token from localStorage override');
    return override;
  }
  
  const token = import.meta?.env?.VITE_VIMEO_ACCESS_TOKEN;
  if (!token) {
    console.warn('[vimeoService] Missing VITE_VIMEO_ACCESS_TOKEN env var. Public meta calls may fail.');
  }
  return token;
}

// Fonction helper pour récupérer les vidéos depuis un endpoint
async function fetchVideosFromEndpoint(baseUrl, { perPage, maxPages, query, token }) {
  let url = `${baseUrl}?per_page=${perPage}` + (query ? `&query=${encodeURIComponent(query)}` : '');
  const results = [];
  let pages = 0;
  
  while (url && pages < maxPages) {
    pages += 1;
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.vimeo.*+json;version=3.4',
        },
      });
      if (!res.ok) {
        console.error('[vimeoService] fetchVideosFromEndpoint page failed', res.status, await res.text());
        break;
      }
      const data = await res.json();
      const items = (data.data || []).map(v => ({
        id: v.uri?.split('/').pop(),
        name: v.name,
        description: v.description,
        duration: v.duration,
        pictures: v.pictures?.sizes || [],
        link: v.link,
        privacy: v.privacy,
      }));
      results.push(...items);
      url = data.paging?.next || null;
    } catch (e) {
      console.error('[vimeoService] fetchVideosFromEndpoint error', e);
      break;
    }
  }
  return results;
}

// List all videos for the authenticated Vimeo account. Requires a token with appropriate scopes.
export async function listAllVideos({ perPage = 50, maxPages = 10, query = '', token = null } = {}) {
  // Use provided token or fallback to environment
  const finalToken = token || getToken();
  if (!finalToken) {
    console.error('[vimeoService] Aucun token disponible');
    return [];
  }
  
  console.log('[vimeoService] Récupération de toutes les vidéos depuis plusieurs endpoints...');
  
  // Récupérer les vidéos depuis TOUS les endpoints possibles
  const allEndpoints = [
    // Endpoints directs
    `${VIMEO_API_BASE}/me/videos`,                    // Vidéos personnelles
    `${VIMEO_API_BASE}/me/videos?filter=appears`,     // Vidéos où tu apparais
    `${VIMEO_API_BASE}/me/videos?filter=embeddable`,  // Vidéos intégrables
    `${VIMEO_API_BASE}/videos`,                       // Toutes les vidéos accessibles
    // Endpoints équipe/organisation
    `${VIMEO_API_BASE}/me/team/videos`,               // Vidéos d'équipe

  ];
  
  console.log('[vimeoService] Test de tous les endpoints disponibles...');
  
  // Tester chaque endpoint individuellement avec logs
  const allVideoResults = [];
  for (const endpoint of allEndpoints) {
    try {
      console.log(`[vimeoService] Test endpoint: ${endpoint}`);
      const videos = await fetchVideosFromEndpoint(endpoint, { perPage, maxPages: 2, query, token: finalToken });
      console.log(`[vimeoService] ${endpoint} → ${videos.length} vidéos`);
      allVideoResults.push(...videos);
    } catch (e) {
      console.log(`[vimeoService] ${endpoint} → ERREUR:`, e.message);
    }
  }
  
  // Récupérer aussi les vidéos des conteneurs
  const containersResults = await Promise.all([
    fetchAlbumsAndVideos({ perPage, maxPages, query, token: finalToken }),
    fetchFoldersAndVideos({ perPage, maxPages, query, token: finalToken }),
    fetchProjectsAndVideos({ perPage, maxPages, query, token: finalToken }),
    fetchTeamFoldersAndVideos({ perPage, maxPages, query, token: finalToken })
  ]);
  
  const allVideos = [...allVideoResults, ...containersResults.flat()];
  
  // Combiner et dédupliquer par ID
  const uniqueVideos = allVideos.filter((video, index, self) => 
    index === self.findIndex(v => v.id === video.id)
  );
  
  console.log(`[vimeoService] TOTAL: ${uniqueVideos.length} vidéos uniques récupérées`);
  return uniqueVideos;
}

// Récupérer les vidéos des albums
async function fetchAlbumsAndVideos({ perPage, maxPages, query, token }) {
  try {
    // D'abord récupérer la liste des albums (pas les vidéos directement)
    const albumsResponse = await fetch(`${VIMEO_API_BASE}/me/albums?per_page=100`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.vimeo.*+json;version=3.4',
      },
    });
    
    if (!albumsResponse.ok) {
      console.error('[vimeoService] Failed to fetch albums', albumsResponse.status);
      return [];
    }
    
    const albumsData = await albumsResponse.json();
    const albums = albumsData.data || [];
    const albumVideos = [];
    
    // Pour chaque album, récupérer ses vidéos
    for (const album of albums.slice(0, 20)) { // Limite à 20 albums pour éviter trop de requêtes
      const albumId = album.uri?.split('/').pop();
      if (albumId) {
        const videos = await fetchVideosFromEndpoint(`${VIMEO_API_BASE}/albums/${albumId}/videos`, { perPage, maxPages: 5, query, token });
        albumVideos.push(...videos);
      }
    }
    
    console.log(`[vimeoService] ${albumVideos.length} vidéos récupérées depuis les albums`);
    return albumVideos;
  } catch (e) {
    console.error('[vimeoService] fetchAlbumsAndVideos error', e);
    return [];
  }
}

// Récupérer les vidéos des dossiers
async function fetchFoldersAndVideos({ perPage, maxPages, query, token }) {
  try {
    console.log('[vimeoService] Récupération des dossiers...');
    // D'abord récupérer la liste des dossiers (pas les vidéos directement)
    const foldersResponse = await fetch(`${VIMEO_API_BASE}/me/folders?per_page=100`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.vimeo.*+json;version=3.4',
      },
    });
    
    if (!foldersResponse.ok) {
      console.error('[vimeoService] Failed to fetch folders', foldersResponse.status, await foldersResponse.text());
      return [];
    }
    
    const foldersData = await foldersResponse.json();
    const folders = foldersData.data || [];
    console.log(`[vimeoService] ${folders.length} dossiers trouvés:`, folders.map(f => f.name || f.uri));
    const folderVideos = [];
    
    // Pour chaque dossier, récupérer ses vidéos
    for (const folder of folders.slice(0, 20)) { // Limite à 20 dossiers
      const folderId = folder.uri?.split('/').pop();
      console.log(`[vimeoService] Récupération vidéos du dossier ${folder.name || folderId}...`);
      if (folderId) {
        const videos = await fetchVideosFromEndpoint(`${VIMEO_API_BASE}/folders/${folderId}/videos`, { perPage, maxPages: 5, query, token });
        console.log(`[vimeoService] ${videos.length} vidéos dans le dossier ${folder.name || folderId}`);
        folderVideos.push(...videos);
      }
    }
    
    console.log(`[vimeoService] ${folderVideos.length} vidéos récupérées depuis les dossiers`);
    return folderVideos;
  } catch (e) {
    console.error('[vimeoService] fetchFoldersAndVideos error', e);
    return [];
  }
}

// Récupérer les vidéos des projets
async function fetchProjectsAndVideos({ perPage, maxPages, query, token }) {
  try {
    // D'abord récupérer la liste des projets (pas les vidéos directement)
    const projectsResponse = await fetch(`${VIMEO_API_BASE}/me/projects?per_page=100`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.vimeo.*+json;version=3.4',
      },
    });
    
    if (!projectsResponse.ok) {
      console.error('[vimeoService] Failed to fetch projects', projectsResponse.status);
      return [];
    }
    
    const projectsData = await projectsResponse.json();
    const projects = projectsData.data || [];
    const projectVideos = [];
    
    // Pour chaque projet, récupérer ses vidéos
    for (const project of projects.slice(0, 20)) { // Limite à 20 projets
      const projectId = project.uri?.split('/').pop();
      if (projectId) {
        const videos = await fetchVideosFromEndpoint(`${VIMEO_API_BASE}/projects/${projectId}/videos`, { perPage, maxPages: 5, query, token });
        projectVideos.push(...videos);
      }
    }
    
    console.log(`[vimeoService] ${projectVideos.length} vidéos récupérées depuis les projets`);
    return projectVideos;
  } catch (e) {
    console.error('[vimeoService] fetchProjectsAndVideos error', e);
    return [];
  }
}

// Récupérer les vidéos des dossiers d'équipe
async function fetchTeamFoldersAndVideos({ perPage, maxPages, query, token }) {
  try {
    console.log('[vimeoService] Récupération des dossiers d\'équipe...');
    // D'abord récupérer la liste des dossiers d'équipe (pas les vidéos directement)
    const teamFoldersResponse = await fetch(`${VIMEO_API_BASE}/me/team/folders?per_page=100`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.vimeo.*+json;version=3.4',
      },
    });
    
    if (!teamFoldersResponse.ok) {
      console.error('[vimeoService] Failed to fetch team folders', teamFoldersResponse.status, await teamFoldersResponse.text());
      return [];
    }
    
    const teamFoldersData = await teamFoldersResponse.json();
    const teamFolders = teamFoldersData.data || [];
    console.log(`[vimeoService] ${teamFolders.length} dossiers d'équipe trouvés:`, teamFolders.map(f => f.name || f.uri));
    const teamFolderVideos = [];
    
    // Pour chaque dossier d'équipe, récupérer ses vidéos
    for (const teamFolder of teamFolders.slice(0, 20)) { // Limite à 20 dossiers d'équipe
      const teamFolderId = teamFolder.uri?.split('/').pop();
      console.log(`[vimeoService] Récupération vidéos du dossier d'équipe ${teamFolder.name || teamFolderId}...`);
      if (teamFolderId) {
        const videos = await fetchVideosFromEndpoint(`${VIMEO_API_BASE}/team/folders/${teamFolderId}/videos`, { perPage, maxPages: 5, query, token });
        console.log(`[vimeoService] ${videos.length} vidéos dans le dossier d'équipe ${teamFolder.name || teamFolderId}`);
        teamFolderVideos.push(...videos);
      }
    }
    
    console.log(`[vimeoService] ${teamFolderVideos.length} vidéos récupérées depuis les dossiers d'équipe`);
    return teamFolderVideos;
  } catch (e) {
    console.error('[vimeoService] fetchTeamFoldersAndVideos error', e);
    return [];
  }
}

export function buildEmbedUrl(vimeoId, params = {}) {
  const base = `https://player.vimeo.com/video/${encodeURIComponent(vimeoId)}`;
  const defaultParams = {
    dnt: 1,
    byline: 0,
    title: 0,
    autopause: 1,
    portrait: 0,
    speed: 1,
    transparent: 0,
  };
  const q = new URLSearchParams({ ...defaultParams, ...params });
  return `${base}?${q.toString()}`;
}

export async function getVideoMeta(vimeoId) {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${VIMEO_API_BASE}/videos/${encodeURIComponent(vimeoId)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.vimeo.*+json;version=3.4',
      },
    });
    if (!res.ok) {
      console.error('[vimeoService] getVideoMeta failed', res.status, await res.text());
      return null;
    }
    const data = await res.json();
    return {
      id: vimeoId,
      name: data.name,
      description: data.description,
      duration: data.duration,
      pictures: data.pictures?.sizes || [],
      link: data.link,
      privacy: data.privacy,
    };
  } catch (e) {
    console.error('[vimeoService] getVideoMeta error', e);
    return null;
  }
}

export async function verifyDomainPrivacy(vimeoId, domain) {
  // Best-effort check if privacy domain matches. Some details require elevated scopes.
  const meta = await getVideoMeta(vimeoId);
  if (!meta) return false;
  // If privacy is public, it's fine; if embed is whitelist, we assume domain was configured in Vimeo dashboard.
  if (meta.privacy?.view === 'anybody') return true;
  if (meta.privacy?.embed === 'whitelist') {
    // Vimeo API v3.4 does not always return the whitelist; rely on dashboard configuration.
    return !!domain; // Assume OK if domain provided; real validation should be server-side with elevated scopes.
  }
  return true; // Fallback non-blocking on client
}

// Simple debug helper to validate token and scopes from the client.
export async function testVimeoAuth(token = null) {
  const finalToken = token || getToken();
  if (!finalToken) {
    return { ok: false, status: 0, body: 'Missing VITE_VIMEO_ACCESS_TOKEN' };
  }
  try {
    const res = await fetch(`${VIMEO_API_BASE}/me`, {
      headers: {
        Authorization: `Bearer ${finalToken}`,
        Accept: 'application/vnd.vimeo.*+json;version=3.4',
      },
    });
    const txt = await res.text();
    return { ok: res.ok, status: res.status, body: txt };
  } catch (e) {
    return { ok: false, status: -1, body: String(e) };
  }
}
