const fs = require('fs');
const path = require('path');
const supabase = require('../supabaseClient'); // Utilisation du client centralisé

const postsFilePath = path.join(__dirname, '../../../pfpheds-default-rtdb-Posts-export.json');

// Fonction pour mapper les anciens ID utilisateur (Firebase) aux nouveaux (Supabase)
// NOTE : Cette fonction est un exemple. Vous DEVEZ la remplir avec votre propre logique
// pour trouver le bon `author_id` (UUID) à partir de l'ancien `IdUser` (string).
async function getSupabaseUserId(firebaseUserId) {
  // Recherche l'utilisateur dans user_profiles par son ancien ID Firebase
  const { data, error } = await supabase
    .from('user_profiles')
    .select('user_id') // On sélectionne la colonne UUID
    .eq('firebase_uid', firebaseUserId)
    .single();

  if (error || !data) {
    console.warn(`Impossible de trouver l'utilisateur Supabase pour Firebase ID: ${firebaseUserId}`);
    return null;
  }
  return data.user_id; // On retourne l'UUID
}


async function importPosts() {
  let postsData;
  try {
    console.log("Lecture du fichier JSON des posts...");
    const fileContent = fs.readFileSync(postsFilePath, 'utf-8');
    postsData = JSON.parse(fileContent);
    console.log("Fichier JSON lu et analysé avec succès.");
  } catch (error) {
    console.error("Erreur critique lors de la lecture ou de l'analyse du fichier JSON:", error);
    return; // Arrête l'exécution si le fichier ne peut être lu
  }

  const allPosts = [];
  const allLikes = [];
  const allPostHashtags = [];
  const uniqueHashtags = new Set();

  // Première passe : collecter tous les hashtags uniques
  for (const postId in postsData) {
    const post = postsData[postId];
    if (post.Hashtags) {
      for (const hashtag in post.Hashtags) {
        uniqueHashtags.add(hashtag);
      }
    }
  }

  // Insérer les hashtags uniques dans la table `hashtags`
  const hashtagInsertData = Array.from(uniqueHashtags).map(code => ({ code }));
  if (hashtagInsertData.length > 0) {
    console.log(`Préparation à insérer ${hashtagInsertData.length} hashtags uniques...`);
    const { error: hashtagMasterError } = await supabase.from('hashtags').upsert(hashtagInsertData, { onConflict: 'code' });
    if (hashtagMasterError) {
      console.error('Erreur lors de l\'insertion des hashtags uniques:', hashtagMasterError);
      return; // Arrêter si l'insertion des hashtags de base échoue
    } else {
      console.log('Hashtags uniques insérés avec succès.');
    }
  }

  // Deuxième passe : traiter les posts et les liaisons
  for (const postId in postsData) {
    const post = postsData[postId];
    
    // Traiter le post principal
    const authorId = await getSupabaseUserId(post.IdUser); // Peut être null

    allPosts.push({
        id: postId,
        author_id: authorId, // Sera null si l'utilisateur n'est pas trouvé
        firebase_author_id: post.IdUser, // Conserve l'ID Firebase original
        community_id: post.Community || null,
        parent_id: null, // C'est un post principal
        content: post.Content,
        media: post.media ? JSON.stringify(post.media) : null,
        created_at: new Date(post.Timestamp).toISOString()
    });

    // Traiter les "j'aime" du post principal (uniquement si l'utilisateur existe)
    if (post.likes) {
        for (const likedByUserId in post.likes) {
            const supabaseLikerId = await getSupabaseUserId(likedByUserId);
            if (supabaseLikerId) { // On ne peut pas ajouter de "like" pour un utilisateur inexistant
                allLikes.push({ post_id: postId, user_id: supabaseLikerId });
            }
        }
    }

    // Traiter les hashtags du post principal
    if (post.Hashtags) {
        for (const hashtag in post.Hashtags) {
            allPostHashtags.push({ post_id: postId, hashtag_code: hashtag });
        }
    }

    // Traiter les réponses (replies) comme des posts enfants
    if (post.replies) {
      for (const replyId in post.replies) {
        const reply = post.replies[replyId];
        const replyAuthorId = await getSupabaseUserId(reply.IdUser); // Peut être null
        
        allPosts.push({
            id: replyId,
            author_id: replyAuthorId, // Sera null si l'utilisateur n'est pas trouvé
            firebase_author_id: reply.IdUser, // Conserve l'ID Firebase original
            community_id: null, // Les réponses n'ont pas de communauté dans votre JSON
            parent_id: postId, // Lien vers le post parent
            content: reply.Content,
            media: null, // Pas de media dans les réponses
            created_at: new Date(reply.Timestamp).toISOString()
        });
      }
    }
  }

  console.log(`Préparation à insérer ${allPosts.length} posts/réponses...`);
  const { error: postsError } = await supabase.from('posts').upsert(allPosts);
  if (postsError) console.error('Erreur lors de l\'insertion des posts:', postsError);
  else console.log('Posts insérés avec succès.');

  console.log(`Préparation à insérer ${allLikes.length} likes...`);
  const { error: likesError } = await supabase.from('post_likes').upsert(allLikes);
  if (likesError) console.error('Erreur lors de l\'insertion des likes:', likesError);
  else console.log('Likes insérés avec succès.');

  if (allPostHashtags.length > 0) {
    console.log(`Préparation à insérer ${allPostHashtags.length} liaisons de hashtags de posts...`);
    const { error: hashtagsError } = await supabase.from('post_hashtags').upsert(allPostHashtags);
    if (hashtagsError) console.error('Erreur lors de l\'insertion des hashtags de posts:', hashtagsError);
    else console.log('Hashtags de posts insérés avec succès.');
  } else {
    console.log('Aucune liaison de hashtag de post à insérer.');
  }
}

importPosts().catch(error => {
  console.error("Une erreur non capturée s'est produite lors de l'importation:", error);
});