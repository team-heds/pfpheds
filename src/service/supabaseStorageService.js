import { supabase } from '../supabase.js'

export class SupabaseStorageService {
  constructor() {
    this.supabase = supabase
    this.allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    this.extensionByMimeType = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp'
    }
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

  createAvatarPath(userId, file) {
    const extension = this.extensionByMimeType[file.type]
    const uniquePart = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    return `${userId}/avatar-${uniquePart}.${extension}`
  }

  async assertAuthenticatedOwner(userId) {
    const { data, error } = await this.supabase.auth.getUser()
    if (error) throw error

    const authenticatedUserId = data?.user?.id
    if (!authenticatedUserId || authenticatedUserId !== userId) {
      throw new Error('Vous ne pouvez modifier que votre propre avatar')
    }
  }

  async uploadAvatar(userId, file) {
    try {
      this.validateAvatarFile(file)
      const filePath = this.createAvatarPath(userId, file)

      const { data, error } = await this.supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
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

  async replaceUserAvatar(userId, file, profileFields = {}) {
    this.validateAvatarFile(file)
    await this.assertAuthenticatedOwner(userId)

    const oldFiles = await this.listUserAvatars(userId)
    const uploadResult = await this.uploadAvatar(userId, file)

    const { data: profile, error: profileError } = await this.supabase
      .from('user_profiles')
      .update({
        ...profileFields,
        avatar_url: uploadResult.url,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select('user_id, avatar_url, updated_at')
      .single()

    if (profileError || !profile) {
      const profileMessage = profileError?.message || "Le profil n'a pas ete mis a jour"
      try {
        await this.deleteAvatar(uploadResult.path, { throwOnError: true })
      } catch (cleanupError) {
        throw new Error(`${profileMessage}. Le nettoyage du nouvel avatar a aussi echoue: ${cleanupError.message}`)
      }
      throw new Error(profileMessage)
    }

    const oldPaths = oldFiles
      .map((entry) => entry?.name && `${userId}/${entry.name}`)
      .filter((path) => path && path !== uploadResult.path)

    if (oldPaths.length > 0) {
      await this.deleteAvatar(oldPaths)
    }

    return {
      ...uploadResult,
      profile
    }
  }

  async deleteAvatar(filePath, { throwOnError = false } = {}) {
    try {
      const paths = Array.isArray(filePath) ? filePath : [filePath]
      if (paths.length === 0) return

      const { error } = await this.supabase.storage
        .from('avatars')
        .remove(paths)

      if (error) {
        if (throwOnError) throw error
        console.warn('[Storage] Avatar delete warning:', error)
        return false
      }
      return true
    } catch (error) {
      if (throwOnError) throw error
      console.warn('[Storage] Avatar delete error:', error)
      return false
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
