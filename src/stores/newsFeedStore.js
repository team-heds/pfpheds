import { defineStore } from 'pinia';
import { db } from 'root/firebase';
import { ref as dbRef, push, set, onValue } from 'firebase/database';
import { ref } from 'vue';

export const useNewsFeedStore = defineStore('newsFeed', () => {
  const posts = ref([]);

  function listenPosts() {
    const postsRef = dbRef(db, 'newsFeedPosts');
    onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      posts.value = data
        ? Object.entries(data).map(([id, post]) => ({ id, ...post }))
        : [];
    });
  }

  async function shareEvent(event, user) {
    const postsRef = dbRef(db, 'newsFeedPosts');
    const newPostRef = push(postsRef);
    const postData = {
      type: 'share_event',
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.startDate,
      eventLieu: event.lieu || '',
      eventImage: event.image || '',
      sharedBy: {
        uid: user.uid,
        nom: user.nom,
        prenom: user.prenom,
        photoURL: user.photoURL || ''
      },
      sharedAt: new Date().toISOString()
    };
    await set(newPostRef, postData);
  }

  return { posts, listenPosts, shareEvent };
});
