import { supabase } from '../supabase.js'

class SupabaseStorageService {
  constructor() {
    this.supabase = supabase
    this.allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    this.maxFileSize = 5 * 1024 * 1024
  }

  validateAvatarFile(file) {
    if (!file) {
      throw new Error('Aucun fichier selectionne')
    }

    if (!this.allowedMimeTypes.includes(file.type)) {
      throw new Error('Format non supporte. Utilisez JPG, PNG, GIF ou WEBP')
    }

    if (file.size > this.maxFileSize) {
      throw new Error('Le fichier depasse la limite de 5 MB')
    }
  }

  async uploadAvatar(userId, file) {
    try {
      this.validateAvatarFile(file)

      const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`

      try {
        const oldFiles = await this.listUserAvatars(userId)
        const oldPaths = oldFiles
          .map((entry) => `${userId}/${entry.name}`)
          .filter(Boolean)

        if (oldPaths.length > 0) {
          await this.deleteAvatar(oldPaths)
        }
      } catch (cleanupError) {
        console.warn('[Storage] Cleanup avatars ignored:', cleanupError)
      }

      const { data, error } = await this.supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) {
        console.error('Avatar upload failed:', error)
        throw error
      }

      const { data: urlData } = this.supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return {
        url: urlData.publicUrl,
        path: filePath,
        data
      }
    } catch (error) {
      console.error('Avatar upload error:', error)
      throw new Error(`Erreur upload avatar: ${error.message}`)
    }
  }

  async deleteAvatar(filePath) {
    try {
      const paths = Array.isArray(filePath) ? filePath : [filePath]
      if (paths.length === 0) return

      const { error } = await this.supabase.storage
        .from('avatars')
        .remove(paths)

      if (error) {
        console.warn('[Storage] Avatar delete warning:', error)
      }
    } catch (error) {
      console.warn('[Storage] Avatar delete error:', error)
    }
  }

  async listUserAvatars(userId) {
    try {
      const { data, error } = await this.supabase.storage
        .from('avatars')
        .list(userId, {
          limit: 20,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) {
        console.error('Avatar listing failed:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Avatar listing error:', error)
      return []
    }
  }

  async ensureAvatarsBucket() {
    return true
  }
}

const supabaseStorageService = new SupabaseStorageService()
export default supabaseStorageService
