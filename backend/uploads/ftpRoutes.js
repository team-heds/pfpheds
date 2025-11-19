const express = require('express')
const multer = require('multer')
const ftp = require('basic-ftp')
const path = require('path')
const { Readable } = require('stream')
const SftpClient = require('ssh2-sftp-client')

const router = express.Router()

// Multer in-memory storage (for test). For large videos, prefer diskStorage/streaming.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    // 100 MB per file for test purposes. Adjust as needed.
    fileSize: 100 * 1024 * 1024,
    files: 20,
  },
})

// Diagnostic route to check server-side configuration
router.get('/diagnostic', (req, res) => {
  const configured = !!(process.env.FTP_HOST && process.env.FTP_USER && process.env.FTP_PASSWORD)
  res.json({
    ok: true,
    configured,
    host: process.env.FTP_HOST || null,
    baseDir: process.env.FTP_BASE_DIR || null,
    secure: (process.env.FTP_SECURE || 'true'),
    rejectUnauthorized: (process.env.FTP_REJECT_UNAUTHORIZED ?? 'true'),
    port: process.env.FTP_PORT || null,
    timeoutMs: process.env.FTP_TIMEOUT_MS || null,
    protocol: (process.env.FTP_PROTOCOL || 'ftp'),
  })
})

function sanitize(seg) {
  if (!seg) return 'public'
  return String(seg).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180)
}

function uniqueFileName(originalName) {
  const ext = path.extname(originalName || '')
  const base = path.basename(originalName || 'file', ext)
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `${sanitize(base)}_${stamp}${ext || ''}`
}

function envTrim(v) {
  return (v ?? '').toString().trim()
}

function getProtocol() {
  return envTrim(process.env.FTP_PROTOCOL || 'ftp').toLowerCase()
}

function getFtpConfig() {
  const secureEnv = (process.env.FTP_SECURE || 'true').toString().toLowerCase()
  let secureMode = true
  if (secureEnv === 'false' || secureEnv === '0') secureMode = false
  else if (secureEnv === 'implicit') secureMode = 'implicit'

  const rejectUnauthorized = (process.env.FTP_REJECT_UNAUTHORIZED ?? 'true').toString().toLowerCase() !== 'false'
  const defaultPort = secureMode === 'implicit' ? 990 : 21
  const port = Number.isFinite(parseInt(process.env.FTP_PORT)) ? parseInt(process.env.FTP_PORT) : defaultPort
  const timeoutMs = Number.isFinite(parseInt(process.env.FTP_TIMEOUT_MS)) ? parseInt(process.env.FTP_TIMEOUT_MS) : 20000

  return {
    host: envTrim(process.env.FTP_HOST),
    user: envTrim(process.env.FTP_USER),
    password: envTrim(process.env.FTP_PASSWORD),
    secure: secureMode,
    secureOptions: { rejectUnauthorized },
    port,
    timeoutMs,
  }
}

async function withFtpClient(fn) {
  const client = new ftp.Client()
  client.ftp.verbose = false
  try {
    const cfg = getFtpConfig()
    // Apply timeout before connecting
    if (cfg.timeoutMs) client.ftp.timeout = cfg.timeoutMs
    await client.access({
      host: cfg.host,
      user: cfg.user,
      password: cfg.password,
      secure: cfg.secure,
      secureOptions: cfg.secureOptions,
      port: cfg.port,
    })
    return await fn(client)
  } finally {
    client.close()
  }
}

function getSftpConfig() {
  const timeoutMs = Number.isFinite(parseInt(process.env.FTP_TIMEOUT_MS)) ? parseInt(process.env.FTP_TIMEOUT_MS) : 30000
  const port = Number.isFinite(parseInt(process.env.FTP_PORT)) ? parseInt(process.env.FTP_PORT) : 22
  return {
    host: envTrim(process.env.FTP_HOST),
    port,
    username: envTrim(process.env.FTP_USER),
    password: envTrim(process.env.FTP_PASSWORD),
    readyTimeout: timeoutMs,
  }
}

async function withSftpClient(fn) {
  const sftp = new SftpClient()
  try {
    const cfg = getSftpConfig()
    await sftp.connect(cfg)
    return await fn(sftp)
  } finally {
    try { await sftp.end() } catch (_) {}
  }
}

// Active test route to validate connection/cwd
router.get('/test-connect', async (req, res) => {
  try {
    const protocol = getProtocol()
    if (protocol === 'sftp') {
      const result = await withSftpClient(async (sftp) => {
        const cwd = await sftp.cwd()
        return { cwd, protocol }
      })
      res.json({ ok: true, ...result })
    } else {
      const result = await withFtpClient(async (client) => {
        const cwd = await client.pwd()
        return { cwd, protocol }
      })
      res.json({ ok: true, ...result })
    }
  } catch (e) {
    console.error('[FTP TEST] Error:', e)
    res.status(500).json({ ok: false, error: e.message || String(e) })
  }
})

// POST /api/ftp/upload
// multipart/form-data with fields: institution, userId, folder (optional), files[]
router.post('/upload', upload.array('files', 20), async (req, res) => {
  try {
    if (!process.env.FTP_HOST || !process.env.FTP_USER || !process.env.FTP_PASSWORD) {
      return res.status(500).json({ ok: false, error: 'FTP credentials not configured on the server' })
    }

    // Normalize baseDir to be relative (no leading slash) to avoid permission issues on FTP root
    const rawBase = envTrim(process.env.FTP_BASE_DIR || 'uploads')
    const baseDir = rawBase.replace(/^\/+/, '').replace(/^\\+/, '') // remove leading / or \\
    const institution = sanitize(req.body.institution || 'general')
    const userId = sanitize(req.body.userId || 'public')
    const extraFolder = sanitize(req.body.folder || '')

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ ok: false, error: 'No files received' })
    }

    const targetDir = [baseDir, institution, userId, extraFolder].filter(Boolean).join('/')
    const protocol = getProtocol()
    console.log(`[FTP] Upload target: ${targetDir} (${req.files.length} files) -> host=${process.env.FTP_HOST}, protocol=${protocol}, secure=${process.env.FTP_SECURE || 'true'}`)

    let results
    if (protocol === 'sftp') {
      results = await withSftpClient(async (sftp) => {
        // mkdir recursif: ssh2-sftp-client mkdir(path, recursive=true)
        await sftp.mkdir(targetDir, true)
        const uploaded = []
        for (const f of req.files) {
          const remoteName = uniqueFileName(f.originalname)
          const remotePath = path.posix.join(targetDir, remoteName)
          await sftp.put(f.buffer, remotePath)
          uploaded.push({
            fieldname: f.fieldname,
            originalname: f.originalname,
            mimetype: f.mimetype,
            size: f.size,
            remotePath,
          })
        }
        return uploaded
      })
    } else {
      results = await withFtpClient(async (client) => {
        await client.ensureDir(targetDir)
        await client.cd(targetDir)
        const uploaded = []
        for (const f of req.files) {
          const remoteName = uniqueFileName(f.originalname)
          const stream = Readable.from(f.buffer)
          await client.uploadFrom(stream, remoteName)
          uploaded.push({
            fieldname: f.fieldname,
            originalname: f.originalname,
            mimetype: f.mimetype,
            size: f.size,
            remotePath: path.posix.join(targetDir, remoteName),
          })
        }
        return uploaded
      })
    }

    return res.json({ ok: true, count: results.length, files: results })
  } catch (e) {
    console.error('[FTP UPLOAD] Error:', e)
    return res.status(500).json({ ok: false, error: e.message || String(e) })
  }
})

module.exports = router
