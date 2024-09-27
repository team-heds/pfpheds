<template>
  <div>
    <div class="container mt-4">
      <h2>Profil de {{ user ? user.fullName : 'Utilisateur' }}</h2>

      <div v-if="user">
        <div v-if="isCurrentUser">
          <!-- Form to edit profile if the user is viewing their own profile -->
          <div class="form-group">
            <label for="fullName"><strong>Nom complet:</strong></label>
            <input v-model="editableUser.fullName" type="text" id="fullName" class="form-control" />
          </div>
          <div class="form-group mt-2">
            <label for="bio"><strong>Bio:</strong></label>
            <textarea v-model="editableUser.bio" id="bio" class="form-control"></textarea>
          </div>
          <div class="form-group mt-2">
            <label for="username"><strong>Nom d'utilisateur:</strong></label>
            <input v-model="editableUser.username" type="text" id="username" class="form-control" />
          </div>
          <div class="form-group mt-2">
            <label for="profileImage"><strong>Image de profil:</strong></label>
            <input type="file" @change="onFileChange" class="form-control" />
            <img v-if="editableUser.profileImageUrl" :src="editableUser.profileImageUrl" alt="Profile Image" class="profile-image-preview mt-2" />
          </div>
          <button class="btn btn-primary mt-3" @click="saveProfile">Enregistrer</button>
        </div>
        <div v-else>
          <!-- Display profile information for other users -->
          <p><strong>Nom complet:</strong> {{ user.fullName }}</p>
          <p><strong>Bio:</strong> {{ user.bio }}</p>
          <p><strong>ID:</strong> {{ userId }}</p>
          <p v-if="user.roles"><strong>Rôles:</strong> {{ user.roles.join(', ') }}</p>
          <img v-if="user.profileImageUrl" :src="user.profileImageUrl" alt="Profile Image" class="profile-image-preview mt-2" />
        </div>
      </div>
      <div v-else>
        <p>Utilisateur non trouvé.</p>
      </div>

      <div class="posts mt-4">
        <h3>Messages de {{ user ? user.fullName : 'Utilisateur' }}</h3>
        <div v-if="userPosts.length > 0">
          <div v-for="post in userPosts" :key="post.id" class="post">
            <div class="post-content">{{ post.content }}</div>
            <div class="post-meta">{{ formatTimestamp(post.timestamp) }}</div>
          </div>
        </div>
        <div v-else>
          <p>Aucun message trouvé pour cet utilisateur.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Navbar from '@/components/Utils/Navbar.vue';
import { ref as dbRef, onValue, update } from "firebase/database";
import { db, storage, auth } from '../../../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

export default {
  name: 'UserProfile',
  components: {
    Navbar
  },
  props: {
    id: String  // Receive Firebase ID as a prop from the route
  },
  data() {
    return {
      user: null,
      userPosts: [],
      userId: null, // Store the Firebase ID
      editableUser: {
        fullName: '',
        bio: '',
        username: '',
        profileImageUrl: ''
      }, // Data for editing user profile
      isCurrentUser: false, // Flag to check if logged-in user is viewing their own profile
      selectedFile: null, // Store the selected file for profile image upload
    };
  },
  created() {
    this.userId = this.id;  // Assign the route param ID to userId
    this.getCurrentUser();
    this.fetchUserProfile();
    this.fetchUserPosts();
  },
  methods: {
    getCurrentUser() {
      onAuthStateChanged(auth, (user) => {
        if (user && user.uid === this.userId) {
          this.isCurrentUser = true; // Set flag if viewing own profile
        }
      });
    },
    fetchUserProfile() {
      if (!this.userId) return;

      const userRef = dbRef(db, `users/${this.userId}`);
      onValue(userRef, (snapshot) => {
        const userData = snapshot.val();
        if (userData) {
          this.user = {
            fullName: userData.fullName || 'Nom inconnu',
            idkey: this.userId || 'ID inconnu',
            bio: userData.bio || 'Pas de bio disponible',
            roles: userData.roles ? Object.keys(userData.roles) : [],
            profileImageUrl: userData.profileImageUrl || '',
            username: userData.username || ''
          };

          // If current user, populate editable fields
          if (this.isCurrentUser) {
            this.editableUser = {
              fullName: this.user.fullName,
              bio: this.user.bio,
              username: this.user.username,
              profileImageUrl: this.user.profileImageUrl
            };
          }
        } else {
          this.user = null;
        }
      });
    },
    fetchUserPosts() {
      if (!this.userId) return;

      const postsRef = dbRef(db, 'posts');
      onValue(postsRef, (snapshot) => {
        const postsData = snapshot.val();
        if (postsData) {
          this.userPosts = Object.values(postsData).filter(post => post.authorId === this.userId);
        }
      });
    },
    onFileChange(event) {
      this.selectedFile = event.target.files[0];
    },
    uploadProfileImage() {
      return new Promise((resolve, reject) => {
        if (!this.selectedFile) {
          resolve(null);  // No file selected, resolve with null
          return;
        }

        const storageReference = storageRef(storage, `profileImages/${this.userId}`);
        uploadBytes(storageReference, this.selectedFile)
          .then(snapshot => getDownloadURL(snapshot.ref))
          .then(downloadURL => {
            this.editableUser.profileImageUrl = downloadURL;  // Update local state
            resolve(downloadURL);  // Resolve with the download URL
          })
          .catch(reject);
      });
    },
    async saveProfile() {
      if (!this.userId) return;

      try {
        const downloadURL = await this.uploadProfileImage();  // Upload image and get URL
        const userRef = dbRef(db, `users/${this.userId}`);

        // Include the profileImageUrl if a new image was uploaded
        const updateData = {
          fullName: this.editableUser.fullName,
          bio: this.editableUser.bio,
          username: this.editableUser.username,
          ...(downloadURL && { profileImageUrl: downloadURL })
        };

        await update(userRef, updateData);
        alert('Profil mis à jour avec succès.');
        this.fetchUserProfile(); // Refresh user profile data
      } catch (error) {
        console.error("Erreur lors de la mise à jour du profil:", error);
      }
    },
    formatTimestamp(timestamp) {
      if (!timestamp) return '';
      return new Date(timestamp).toLocaleString();
    }
  }
};
</script>

<style scoped>
.container {
  max-width: 600px;
  margin: 0 auto;
}

.post {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-bottom: 10px;
}

.post-meta {
  font-size: 0.8em;
  color: #999;
}

.form-group {
  margin-bottom: 15px;
}

.form-control {
  width: 100%;
}

.profile-image-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  margin-top: 10px;
}
</style>
