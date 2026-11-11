import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  buildAlpinUploadPath, describeUploadProblem, fitWithin, resolveAlpinImage,
} from '../../src/utils/alpinPhysioMedia'

const read = (file) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8')

describe('Alp’in Physio — adresses des images', () => {
  it('garde les chemins historiques dans le dossier livré avec l’application', () => {
    expect(resolveAlpinImage('JPhotos/Divers/logosponsors/perskindol_2.jpg'))
      .toBe('/assets/images/heds/AlpinPhysioPhoto/JPhotos/Divers/logosponsors/perskindol_2.jpg')
  })

  it('garde telle quelle une photo envoyée depuis l’ordinateur', () => {
    const url = 'https://hedsvs.ch/storage/v1/object/public/alpinphysio/site/photo-abc.webp'
    expect(resolveAlpinImage(url)).toBe(url)
    expect(resolveAlpinImage('/storage/v1/object/public/alpinphysio/site/x.webp')).toBe('/storage/v1/object/public/alpinphysio/site/x.webp')
  })

  it('renvoie une chaîne vide sans image', () => {
    expect(resolveAlpinImage('')).toBe('')
    expect(resolveAlpinImage(null)).toBe('')
    expect(resolveAlpinImage(undefined)).toBe('')
  })
})

describe('Alp’in Physio — préparation des photos', () => {
  it('réduit les grandes photos sans les déformer', () => {
    expect(fitWithin(6000, 4000)).toEqual({ width: 1600, height: 1067 })
    expect(fitWithin(3000, 4000)).toEqual({ width: 1200, height: 1600 })
  })

  it('n’agrandit jamais une petite image', () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 })
  })

  it('fabrique un chemin de stockage sûr', () => {
    expect(buildAlpinUploadPath('events', 'Équipe été 2026 (finale).JPG', 'webp', 'ab12cd'))
      .toBe('events/equipe-ete-2026-finale-ab12cd.webp')
    expect(buildAlpinUploadPath('../../secret', '../../x.png', 'webp', 'id1')).toBe('site/x-id1.webp')
    expect(buildAlpinUploadPath('documents', '', 'pdf', 'id2')).toBe('documents/fichier-id2.pdf')
  })

  it('explique en clair pourquoi un fichier est refusé', () => {
    expect(describeUploadProblem(null)).toMatch(/Aucun fichier/)
    expect(describeUploadProblem({ type: 'image/gif', size: 10 })).toMatch(/JPEG, PNG ou WebP/)
    expect(describeUploadProblem({ type: 'image/jpeg', size: 30 * 1024 * 1024 })).toMatch(/trop lourd/)
    expect(describeUploadProblem({ type: 'text/plain', size: 10 }, { accept: ['application/pdf'] })).toMatch(/PDF/)
    expect(describeUploadProblem({ type: 'image/png', size: 2048 })).toBe('')
  })
})

describe('Alp’in Physio — choix des photos dans la gestion', () => {
  it('remplace la saisie d’adresse par un choix de fichier', () => {
    const editor = read('src/components/alpinphysio/AlpinPhysioSiteEditor.vue')
    const admin = read('src/views/admin/alpinphysio/AlpinPhysioAdminView.vue')
    for (const model of ['draft.heroImage', 'draft.aboutImage', 'member.image', 'activity.image', 'photo.image', 'partner.logo', 'draft.contactImage']) {
      expect(editor).toContain(`<AlpinImageField v-model="${model}"`)
    }
    expect(admin).toContain('<AlpinImageField v-model="eventForm.image_url"')
  })

  it('réserve l’envoi aux responsables côté serveur', () => {
    const migration = read('supabase/migrations/20261111152000_alpinphysio_media_storage.sql')
    expect(migration).toContain("'alpinphysio', 'alpinphysio', true, 5242880")
    for (const policy of ['alpinphysio_media_manager_insert', 'alpinphysio_media_manager_update', 'alpinphysio_media_manager_delete']) {
      expect(migration).toContain(`create policy ${policy} on storage.objects`)
    }
    expect(migration.match(/app_is_alpinphysio_manager\(\)/g).length).toBeGreaterThanOrEqual(4)
  })

  it('la page publique affiche les deux sortes d’adresses', () => {
    expect(read('src/views/associations/AlpinPhysioView.vue')).toContain('const getImagePath = resolveAlpinImage')
  })
})

describe('Alp’in Physio — photos allégées de la page publique', () => {
  const photoRoot = path.resolve(process.cwd(), 'public/assets/images/heds/AlpinPhysioPhoto')
  const optimized = JSON.parse(read('src/data/alpinPhysioOptimizedImages.json'))

  it('sert la version allégée quand elle existe', () => {
    expect(resolveAlpinImage('JPhotos/Divers/photocomite/lea_volpe.jpeg'))
      .toBe('/assets/images/heds/AlpinPhysioPhoto/JPhotos/Divers/photocomite/lea_volpe.jpeg.webp')
  })

  it('chaque photo listée existe en version d’origine et en version allégée, plus légère', () => {
    expect(optimized.length).toBeGreaterThanOrEqual(15)
    for (const relative of optimized) {
      const original = path.join(photoRoot, relative)
      const light = `${original}.webp`
      expect(fs.existsSync(original), `original manquant : ${relative}`).toBe(true)
      expect(fs.existsSync(light), `version allégée manquante : ${relative}`).toBe(true)
      expect(fs.statSync(light).size).toBeLessThan(fs.statSync(original).size)
      expect(fs.statSync(light).size).toBeLessThan(200 * 1024)
    }
  })

  it('couvre les grandes photos du contenu par défaut', () => {
    const content = read('src/data/alpinPhysioSiteContent.js')
    for (const key of ['heroImage', 'aboutImage', 'contactImage']) {
      const value = content.match(new RegExp(`${key}: '([^']+)'`))[1]
      expect(optimized).toContain(value)
    }
  })
})
