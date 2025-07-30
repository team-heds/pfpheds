import { defineStore } from 'pinia'
import { supabase } from '../supabase'

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: [],
    loading: false
  }),
  actions: {
    async fetchMessages() {
      this.loading = true
      const { data } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
      this.messages = data || []
      this.loading = false
    },
    async sendMessage(content) {
      try {
        const { error: userError } = await supabase.from('messages').insert([{ content, sender: 'user' }])
        if (userError) {
          console.error('Erreur insertion user:', userError)
          return
        }
        const botReply = this.generateBotReply(content)
        const { error: botError } = await supabase.from('messages').insert([{ content: botReply, sender: 'bot' }])
        if (botError) {
          console.error('Erreur insertion bot:', botError)
          return
        }
        this.fetchMessages()
      } catch (e) {
        console.error('Erreur générale sendMessage:', e)
      }
    },
    generateBotReply(userMessage) {
      if (userMessage.toLowerCase().includes('bonjour')) return 'Bonjour à toi !'
      return "Je suis un bot, tu m'as dit : " + userMessage
    },
    subscribeRealtime() {
      supabase
        .channel('public:messages')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
          this.fetchMessages()
        })
        .subscribe()
    }
  }
})
