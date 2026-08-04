const express = require('express');
const supabaseClient = require('../supabaseClient.js');
const supabase = supabaseClient.supabaseAdmin || supabaseClient;
const { isAdmin } = require('../middleware/auth');
const router = express.Router();

/**
 * Extracts hashtags from a given text.
 * @param {string} text The text to parse.
 * @returns {string[]} An array of unique hashtag strings (without the '#').
 */
const extractHashtags = (text) => {
    if (!text) return [];
    const regex = /#([a-zA-Z0-9_]+)/g;
    const matches = text.match(regex);
    return matches ? [...new Set(matches.map(tag => tag.substring(1)))] : [];
};

// CREATE a new post or reply
// This route uses a PostgreSQL function `create_post_with_hashtags` which you must add to your database.
// This function handles the creation of the post and the linking of hashtags in a single transaction.
router.post('/', async (req, res) => {
    const { content, community_id = null, parent_id = null, media = null } = req.body;
    const author_id = req.auth.userId;

    if (!content || typeof content !== 'string' || content.length > 10_000) {
        return res.status(400).json({ error: 'Content is required and must not exceed 10,000 characters.' });
    }

    try {
        const { data, error } = await supabase.rpc('create_post_with_hashtags', {
            p_author_id: author_id,
            p_content: content,
            p_community_id: community_id,
            p_parent_id: parent_id,
            p_media: media,
            p_hashtags: extractHashtags(content)
        });

        if (error) throw error;

        // The function should return the newly created post, so we can send it back.
        res.status(201).json(data);
    } catch (error) {
        console.error('[POSTS] Create failed:', error.message);
        res.status(500).json({ error: 'Failed to create post.' });
    }
});

// READ all top-level posts (for a feed)
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                author:user_profiles(*),
                hashtags:post_hashtags(hashtag_code:hashtags(code)),
                likes(count),
                replies:posts(count)
            `)
            .is('parent_id', null) // Only fetch top-level posts
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('[POSTS] Fetch failed:', error.message);
        res.status(500).json({ error: 'Failed to fetch posts.' });
    }
});

// UPDATE a post
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { content, media } = req.body;

    if ((!content && !media) || (content && (typeof content !== 'string' || content.length > 10_000))) {
        return res.status(400).json({ error: 'Content or media must be provided for an update.' });
    }

    try {
        const { data: existing, error: existingError } = await supabase
            .from('posts')
            .select('id, author_id')
            .eq('id', id)
            .maybeSingle();
        if (existingError) throw existingError;
        if (!existing) return res.status(404).json({ error: 'Post not found' });
        if (existing.author_id !== req.auth.userId && !isAdmin(req.auth)) {
            return res.status(403).json({ error: 'Forbidden.' });
        }

        const { data, error } = await supabase
            .from('posts')
            .update({ content, media, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Post not found' });

        res.json(data);
    } catch (error) {
        console.error('[POSTS] Update failed:', error.message);
        res.status(500).json({ error: 'Failed to update post.' });
    }
});

// DELETE a post
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const { data: existing, error: existingError } = await supabase
            .from('posts')
            .select('id, author_id')
            .eq('id', id)
            .maybeSingle();
        if (existingError) throw existingError;
        if (!existing) return res.status(404).json({ error: 'Post not found' });
        if (existing.author_id !== req.auth.userId && !isAdmin(req.auth)) {
            return res.status(403).json({ error: 'Forbidden.' });
        }

        const { data, error } = await supabase
            .from('posts')
            .delete()
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Post not found or you do not have permission to delete it.' });

        res.status(200).json({ message: 'Post deleted successfully', deletedPost: data });
    } catch (error) {
        console.error('[POSTS] Delete failed:', error.message);
        res.status(500).json({ error: 'Failed to delete post.' });
    }
});

module.exports = router;
