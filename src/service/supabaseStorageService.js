// Service pour gérer les uploads sur Supabase Storage
import { supabase } from '../supabase.js'

class SupabaseStorageService {
  constructor() {
    this.supabase = supabase
  }

  /**
   * Upload un fichier avatar pour un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {File} file - Fichier à uploader
   * @returns {Promise<{url: string, path: string}>} URL publique et chemin du fichier
   */
  async uploadAvatar(userId, file) {
    try {
      // Générer un nom de fichier unique avec timestamp
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload du fichier dans le bucket 'avatars'
      const { data, error } = await this.supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Remplace le fichier s'il existe déjà
        })

      if (error) {
        console.error('❌ Erreur upload Supabase Storage:', error)
        throw error
      }

      // Récupérer l'URL publique
      const { data: urlData } = this.supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl

      return {
        url: publicUrl,
        path: filePath,
        data: data
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'upload avatar:', error)
      throw new Error(`Erreur upload avatar: ${error.message}`)
    }
  }

  /**
   * Supprime un ancien avatar
   * @param {string} filePath - Chemin du fichier à supprimer
   */
  async deleteAvatar(filePath) {
    try {
      const { error } = await this.supabase.storage
        .from('avatars')
        .remove([filePath])

      if (error) {
        console.warn('⚠️ Erreur suppression ancien avatar:', error)
        // Ne pas faire échouer l'opération si la suppression échoue
      }
    } catch (error) {
      console.warn('⚠️ Erreur lors de la suppression:', error)
      // Ne pas faire échouer l'opération
    }
  }

  /**
   * Liste les avatars d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   */
  async listUserAvatars(userId) {
    try {
      const { data, error } = await this.supabase.storage
        .from('avatars')
        .list(`avatars/${userId}`, {
          limit: 10,
          offset: 0
        })

      if (error) {
        console.error('❌ Erreur listage avatars:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('❌ Erreur lors du listage:', error)
      return []
    }
  }

  /**
   * Vérifie si le bucket avatars existe et le crée si nécessaire
   */
  async ensureAvatarsBucket() {
    try {
      // Vérifier si le bucket existe
      const { data: buckets, error: listError } = await this.supabase.storage.listBuckets()
      
      if (listError) {
        // Storage not configured on this instance — skip silently
        console.warn('[Storage] Bucket listing unavailable (storage may not be configured)')
        return false
      }

      const avatarsBucket = buckets.find(bucket => bucket.name === 'avatars')
      
      if (!avatarsBucket) {
        // Créer le bucket
        const { data, error: createError } = await this.supabase.storage.createBucket('avatars', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          fileSizeLimit: 5242880 // 5MB
        })

        if (createError) {
          console.error('❌ Erreur création bucket:', createError)
          return false
        }

      }

      return true
    } catch (error) {
      console.error('❌ Erreur vérification bucket:', error)
      return false
    }
  }
}

// Export d'une instance unique
const supabaseStorageService = new SupabaseStorageService()
export default supabaseStorageService
