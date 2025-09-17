-- This function creates a post, finds or creates the necessary hashtags,
-- and links them to the post in a single transaction.

CREATE OR REPLACE FUNCTION create_post_with_hashtags(
    p_author_id UUID,
    p_content TEXT,
    p_community_id UUID,
    p_parent_id UUID,
    p_media JSONB,
    p_hashtags TEXT[]
)
RETURNS SETOF posts AS $$
DECLARE
    new_post posts;
    tag_name TEXT;
    tag_id INT;
BEGIN
    -- Insert the new post and return its data into `new_post`
    INSERT INTO public.posts (author_id, content, community_id, parent_id, media)
    VALUES (p_author_id, p_content, p_community_id, p_parent_id, p_media)
    RETURNING * INTO new_post;

    -- Loop through the provided hashtags
    FOREACH tag_name IN ARRAY p_hashtags
    LOOP
        -- Find the hashtag ID. If it doesn't exist, it will be created.
        -- This uses a separate helper function `find_or_create_hashtag`.
        tag_id := find_or_create_hashtag(tag_name);

        -- Link the post and the hashtag
        INSERT INTO public.post_hashtags (post_id, hashtag_id)
        VALUES (new_post.id, tag_id)
        ON CONFLICT DO NOTHING; -- Avoid duplicates
    END LOOP;

    -- Return the newly created post
    RETURN QUERY SELECT * FROM public.posts WHERE id = new_post.id;
END;
$$ LANGUAGE plpgsql;

-- Helper function to find or create a hashtag and return its ID.
-- This avoids race conditions and simplifies the main function.
CREATE OR REPLACE FUNCTION find_or_create_hashtag(tag_code TEXT)
RETURNS INT AS $$
DECLARE
    hashtag_id INT;
BEGIN
    -- First, try to select the ID of the existing hashtag
    SELECT id INTO hashtag_id FROM public.hashtags WHERE code = tag_code;

    -- If not found, insert it and get the new ID
    IF hashtag_id IS NULL THEN
        INSERT INTO public.hashtags (code)
        VALUES (tag_code)
        ON CONFLICT (code) DO UPDATE SET code = EXCLUDED.code -- Handles race condition
        RETURNING id INTO hashtag_id;
    END IF;

    RETURN hashtag_id;
END;
$$ LANGUAGE plpgsql;
