/**
 * Migration one-shot : Firebase RTDB "Posts" → Supabase "posts" table
 *
 * Usage (from backend/):  node migrate-firebase-posts.js
 *
 * Reads .env from project root for:
 *   VITE_FIREBASE_DATABASE_URL
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const FIREBASE_DB_URL = process.env.VITE_FIREBASE_DATABASE_URL;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!FIREBASE_DB_URL || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing env vars. Check .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── 1. Build firebase_id → supabase user_id mapping ───
async function buildUserMapping() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('user_id, firebase_id, email')
    .not('firebase_id', 'is', null)
    .neq('firebase_id', '');
  if (error) throw error;
  const map = {};
  for (const row of data) {
    map[row.firebase_id] = { user_id: row.user_id, email: row.email };
  }
  console.log(`✅ User mapping: ${Object.keys(map).length} entries`);
  return map;
}

// ─── 2. Fetch all posts from Firebase RTDB via REST ───
async function fetchFirebasePosts() {
  const url = `${FIREBASE_DB_URL}/Posts.json`;
  console.log(`📥 Fetching posts from ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Firebase REST error: ${res.status} ${res.statusText}`);
  const data = await res.json();
  if (!data) {
    console.log('⚠️ No posts in Firebase');
    return [];
  }
  const entries = Object.entries(data).map(([key, post]) => ({ firebaseId: key, ...post }));
  console.log(`✅ ${entries.length} posts fetched from Firebase`);
  return entries;
}

// ─── 3. Migrate ───
async function migrate() {
  const userMap = await buildUserMapping();
  const fbPosts = await fetchFirebasePosts();

  let inserted = 0;
  let skippedNoUser = 0;
  let skippedError = 0;
  const unmappedUsers = new Set();

  for (const post of fbPosts) {
    const firebaseUid = post.IdUser || post.idUser || post.userId;
    if (!firebaseUid) {
      skippedNoUser++;
      continue;
    }

    const mapped = userMap[firebaseUid];
    if (!mapped) {
      unmappedUsers.add(firebaseUid);
      skippedNoUser++;
      continue;
    }

    // Build Supabase row
    const authorName = post.Author || post.author || mapped.email?.split('@')[0] || 'unknown';
    const content = post.Content || post.content || '';
    const hashtags = post.Hashtags || post.hashtags || {};
    const mentions = post.MentionGroups || post.mentions || {};
    const timestamp = post.Timestamp || post.timestamp;
    const createdAt = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();

    // media URLs from Firebase post
    const mediaUrls = [];
    if (post.media) {
      if (Array.isArray(post.media)) {
        mediaUrls.push(...post.media.filter(Boolean));
      } else if (typeof post.media === 'object') {
        mediaUrls.push(...Object.values(post.media).filter(Boolean));
      }
    }

    try {
      const { data: ins, error: insErr } = await supabase
        .from('posts')
        .insert({
          user_id: mapped.user_id,
          author_name: authorName,
          content,
          created_at: createdAt,
          hashtags: typeof hashtags === 'object' ? hashtags : {},
          mentions: typeof mentions === 'object' ? mentions : {},
          community_id: null,
        })
        .select('id')
        .single();

      if (insErr) {
        console.error(`  ❌ Insert error for post ${post.firebaseId}:`, insErr.message);
        skippedError++;
        continue;
      }

      // Insert media if any
      if (mediaUrls.length > 0) {
        const mediaRows = mediaUrls.map((url) => ({
          post_id: ins.id,
          url,
          type: guessMediaType(url),
        }));
        const { error: mErr } = await supabase.from('post_media').insert(mediaRows);
        if (mErr) {
          console.warn(`  ⚠️ Media insert error for post ${ins.id}:`, mErr.message);
        }
      }

      inserted++;
    } catch (e) {
      console.error(`  ❌ Error migrating post ${post.firebaseId}:`, e.message);
      skippedError++;
    }
  }

  console.log('\n═══════════════════════════════════');
  console.log(`✅ Inserted: ${inserted}`);
  console.log(`⏭️  Skipped (no user mapping): ${skippedNoUser}`);
  console.log(`❌ Skipped (errors): ${skippedError}`);
  if (unmappedUsers.size > 0) {
    console.log(`\n⚠️ ${unmappedUsers.size} unmapped Firebase UIDs:`);
    for (const uid of unmappedUsers) {
      console.log(`   - ${uid}`);
    }
  }
  console.log('═══════════════════════════════════');
}

function guessMediaType(url) {
  if (!url) return 'unknown';
  const lower = url.toLowerCase();
  if (lower.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)/)) return 'image';
  if (lower.match(/\.(mp4|webm|mov|avi)/)) return 'video';
  if (lower.match(/\.(mp3|wav|ogg|aac)/)) return 'audio';
  if (lower.match(/\.(pdf|doc|docx|ppt|pptx|xls|xlsx)/)) return 'document';
  if (lower.includes('image') || lower.includes('photo')) return 'image';
  if (lower.includes('video')) return 'video';
  return 'image';
}

migrate().catch((e) => {
  console.error('❌ Fatal:', e);
  process.exit(1);
});
