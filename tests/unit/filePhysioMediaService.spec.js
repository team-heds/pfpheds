import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/service/apiClient', () => ({ authFetch: vi.fn() }))
import { authFetch } from '@/service/apiClient'
import { getFilePhysioDownloadUrl, openFilePhysioDocument, uploadFilePhysioDocument, validateDocumentUrl } from '@/service/filePhysioMediaService'

const storedFile = { id: 'document/123', url: 'https://storage.example.invalid/storage/v1/object/authenticated/file-physio/documents/form.pdf' }
const ok = payload => ({ ok: true, json: async () => payload })

describe('FilePhysio Supabase storage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uploads to the authenticated backend without Firebase or a public storage URL', async () => {
    authFetch.mockResolvedValue(ok({ file: storedFile }))
    const file = new File(['%PDF-1.7'], 'form.pdf', { type: 'application/pdf' })
    expect(await uploadFilePhysioDocument(file)).toEqual(storedFile)
    const [url, request] = authFetch.mock.calls[0]
    expect(url).toMatch(/\/api\/filePhysio\/files\/upload$/)
    expect(request.method).toBe('POST')
    expect(request.body.get('file')).toEqual(file)
    await expect(uploadFilePhysioDocument(new File(['x'], 'program.exe'))).rejects.toThrow('Format')
    await expect(uploadFilePhysioDocument({ name: 'big.pdf', size: 21 * 1024 * 1024 })).rejects.toThrow('20 Mo')
    expect(authFetch).toHaveBeenCalledTimes(1)
  })

  it('obtains a fresh signed URL by document id and leaves external links intact', async () => {
    authFetch.mockResolvedValue(ok({ url: 'https://storage.example.invalid/signed.pdf?token=temporary' }))
    expect(await getFilePhysioDownloadUrl(storedFile)).toContain('token=temporary')
    expect(authFetch.mock.calls[0][0]).toMatch(/\/files\/document%2F123\/download$/)
    expect(await getFilePhysioDownloadUrl({ url: 'https://hevs.ch/form.pdf' })).toBe('https://hevs.ch/form.pdf')
    expect(authFetch).toHaveBeenCalledTimes(1)
    expect(() => validateDocumentUrl('javascript:alert(1)')).toThrow('adresse web')
    expect(() => validateDocumentUrl('https://name:password@hevs.ch')).toThrow('adresse web')
  })

  it('opens a detached tab during the click before waiting for the signed URL', async () => {
    let respond
    authFetch.mockReturnValue(new Promise(resolve => { respond = resolve }))
    const destination = { opener: 'parent', location: { href: 'about:blank' }, close: vi.fn() }
    const browser = { open: vi.fn(() => destination) }
    const pending = openFilePhysioDocument(storedFile, browser)
    expect(browser.open).toHaveBeenCalledWith('about:blank', '_blank')
    expect(destination.opener).toBe(null)
    respond(ok({ url: 'https://storage.example.invalid/signed.pdf?token=temporary' }))
    await pending
    expect(destination.location.href).toContain('token=temporary')
  })

  it('closes an empty tab after an error and reports blocked pop-ups', async () => {
    authFetch.mockResolvedValue({ ok: false, json: async () => ({ error: 'Document introuvable.' }) })
    const destination = { location: {}, close: vi.fn() }
    await expect(openFilePhysioDocument(storedFile, { open: () => destination })).rejects.toThrow('introuvable')
    expect(destination.close).toHaveBeenCalledOnce()
    await expect(openFilePhysioDocument(storedFile, { open: () => null })).rejects.toThrow('Autorisez les fenêtres')
  })
})
