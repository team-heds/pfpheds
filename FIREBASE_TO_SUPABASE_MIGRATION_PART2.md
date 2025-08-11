# 🔄 Migration Firebase → Supabase PostgreSQL - Partie 2

## 💬 Schéma Système Social et Communautés

```sql
-- Communautés d'utilisateurs
CREATE TABLE communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (type IN ('public', 'private', 'restricted')),
    category VARCHAR(100), -- Ex: "academic", "professional", "social"
    avatar_url TEXT,
    banner_url TEXT,
    rules TEXT,
    member_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Membres des communautés
CREATE TABLE community_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin', 'owner')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    is_muted BOOLEAN DEFAULT false,
    is_banned BOOLEAN DEFAULT false,
    ban_reason TEXT,
    ban_expires_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ,
    UNIQUE(community_id, user_id)
);

-- Publications/Posts
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    community_id UUID REFERENCES communities(id) ON DELETE SET NULL,
    parent_post_id UUID REFERENCES posts(id) ON DELETE CASCADE, -- Pour les réponses
    title VARCHAR(300),
    content TEXT NOT NULL,
    content_type VARCHAR(20) DEFAULT 'text' CHECK (content_type IN ('text', 'rich_text', 'markdown')),
    visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'community', 'private', 'draft')),
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    hashtags TEXT[],
    mentions UUID[], -- IDs des utilisateurs mentionnés
    location_info JSONB,
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Médias attachés aux posts
CREATE TABLE post_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video', 'audio', 'document', 'link')),
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    width INTEGER,
    height INTEGER,
    duration INTEGER, -- Pour vidéos/audio en secondes
    alt_text TEXT,
    caption TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Commentaires sur les posts
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Likes sur posts et commentaires
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('post', 'comment')),
    target_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, target_type, target_id)
);

-- Hashtags populaires
CREATE TABLE hashtags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    usage_count INTEGER DEFAULT 0,
    trending_score DECIMAL(10, 2) DEFAULT 0,
    category VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📝 Schéma Système de Notes et Documentation

```sql
-- Carnets de notes
CREATE TABLE notebooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color
    icon VARCHAR(50) DEFAULT 'book',
    is_shared BOOLEAN DEFAULT false,
    is_template BOOLEAN DEFAULT false,
    template_category VARCHAR(100),
    page_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pages de notes
CREATE TABLE note_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notebook_id UUID NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content JSONB NOT NULL DEFAULT '{}', -- Contenu TipTap/JSON
    content_text TEXT, -- Version texte pour recherche
    order_index INTEGER DEFAULT 0,
    is_favorite BOOLEAN DEFAULT false,
    tags TEXT[],
    last_edited_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partage de carnets
CREATE TABLE notebook_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notebook_id UUID NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
    shared_with_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_level VARCHAR(20) DEFAULT 'read' CHECK (permission_level IN ('read', 'write', 'admin')),
    shared_by UUID NOT NULL REFERENCES users(id),
    shared_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(notebook_id, shared_with_id)
);
```

---

## 📅 Schéma Système d'Événements et Calendrier

```sql
-- Événements
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('course', 'exam', 'conference', 'workshop', 'meeting', 'social', 'deadline', 'other')),
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Europe/Zurich',
    is_all_day BOOLEAN DEFAULT false,
    location TEXT,
    location_url TEXT, -- Lien Maps ou coordonnées
    online_meeting_url TEXT,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    registration_required BOOLEAN DEFAULT false,
    registration_deadline TIMESTAMPTZ,
    is_public BOOLEAN DEFAULT true,
    is_cancelled BOOLEAN DEFAULT false,
    cancellation_reason TEXT,
    organizer_id UUID NOT NULL REFERENCES users(id),
    institution_id UUID REFERENCES institutions(id),
    community_id UUID REFERENCES communities(id),
    image_url TEXT,
    tags TEXT[],
    recurrence_rule TEXT, -- RRULE format
    parent_event_id UUID REFERENCES events(id), -- Pour événements récurrents
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participants aux événements
CREATE TABLE event_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'attended', 'no_show', 'cancelled')),
    registration_date TIMESTAMPTZ DEFAULT NOW(),
    attendance_confirmed_at TIMESTAMPTZ,
    notes TEXT,
    UNIQUE(event_id, user_id)
);
```

---

## 🗳️ Schéma Système de Votations

```sql
-- Votations/Sondages
CREATE TABLE votations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    question TEXT NOT NULL,
    votation_type VARCHAR(20) DEFAULT 'single_choice' CHECK (votation_type IN ('single_choice', 'multiple_choice', 'ranking', 'rating', 'text')),
    is_anonymous BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    allow_comments BOOLEAN DEFAULT true,
    max_choices INTEGER, -- Pour multiple choice
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ NOT NULL,
    target_audience VARCHAR(50) CHECK (target_audience IN ('all', 'students', 'teachers', 'practitioners', 'specific_group')),
    eligible_users UUID[], -- Si target_audience = 'specific_group'
    created_by UUID NOT NULL REFERENCES users(id),
    community_id UUID REFERENCES communities(id),
    total_votes INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    results_visible_before_end BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Options de vote
CREATE TABLE votation_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    votation_id UUID NOT NULL REFERENCES votations(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    option_order INTEGER DEFAULT 0,
    vote_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votes individuels
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    votation_id UUID NOT NULL REFERENCES votations(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    selected_options UUID[] NOT NULL, -- IDs des options sélectionnées
    ranking_order INTEGER[], -- Pour votations de type ranking
    rating_value DECIMAL(3, 2), -- Pour votations de type rating
    text_response TEXT, -- Pour votations de type text
    comment TEXT,
    voted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(votation_id, voter_id)
);
```

---

## 💬 Schéma Système de Messagerie

```sql
-- Conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) DEFAULT 'direct' CHECK (type IN ('direct', 'group', 'community')),
    title VARCHAR(200), -- Pour conversations de groupe
    description TEXT,
    avatar_url TEXT,
    is_archived BOOLEAN DEFAULT false,
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    participant_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participants aux conversations
CREATE TABLE conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'admin', 'owner')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    is_muted BOOLEAN DEFAULT false,
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    unread_count INTEGER DEFAULT 0,
    UNIQUE(conversation_id, user_id)
);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'file', 'system')),
    file_url TEXT,
    file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    reply_to_id UUID REFERENCES messages(id),
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    read_by UUID[] DEFAULT '{}', -- IDs des utilisateurs qui ont lu
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎮 Schéma Système de Gamification

```sql
-- Jeux disponibles
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    game_type VARCHAR(50) NOT NULL,
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'expert')),
    estimated_duration INTEGER, -- En minutes
    max_players INTEGER DEFAULT 1,
    min_players INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    thumbnail_url TEXT,
    instructions TEXT,
    scoring_system JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parties de jeu
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id),
    session_name VARCHAR(200),
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
    max_players INTEGER NOT NULL,
    current_players INTEGER DEFAULT 0,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    duration_seconds INTEGER,
    created_by UUID NOT NULL REFERENCES users(id),
    winner_id UUID REFERENCES users(id),
    game_data JSONB DEFAULT '{}', -- État du jeu
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participants aux jeux
CREATE TABLE game_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    rank INTEGER,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    participant_data JSONB DEFAULT '{}', -- Données spécifiques au joueur
    UNIQUE(session_id, user_id)
);

-- Achievements/Réalisations
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    category VARCHAR(50),
    points_value INTEGER DEFAULT 0,
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    unlock_criteria JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements débloqués par les utilisateurs
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    progress_data JSONB DEFAULT '{}',
    UNIQUE(user_id, achievement_id)
);
```

---

## 📊 Index et Optimisations

```sql
-- Index pour les performances
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_institution ON users(institution_id);
CREATE INDEX idx_users_active ON users(is_active);

CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_community ON posts(community_id);
CREATE INDEX idx_posts_published ON posts(published_at);
CREATE INDEX idx_posts_hashtags ON posts USING GIN(hashtags);

CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_datetime ON events(start_datetime, end_datetime);
CREATE INDEX idx_events_institution ON events(institution_id);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at);

CREATE INDEX idx_stage_places_institution ON stage_places(institution_id);
CREATE INDEX idx_stage_places_dates ON stage_places(start_date, end_date);
CREATE INDEX idx_stage_places_status ON stage_places(status);

-- Index de recherche full-text
CREATE INDEX idx_posts_content_search ON posts USING GIN(to_tsvector('french', content));
CREATE INDEX idx_note_pages_content_search ON note_pages USING GIN(to_tsvector('french', content_text));
```

**Suite dans PARTIE 3** : Scripts de migration, sécurité RLS, et plan de déploiement.
