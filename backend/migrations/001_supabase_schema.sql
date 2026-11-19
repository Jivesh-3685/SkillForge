-- ====================================================================
-- SkillForge AI — Supabase PostgreSQL Database Schema (v2.0)
-- Matches PRD & Build Plan specifications
-- Run this in your Supabase Project: SQL Editor -> New Query -> Run
-- ====================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- TABLE 1: users
-- Core user profiles linked to Firebase Auth UID & GitHub OAuth
-- ====================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT UNIQUE NOT NULL,
    email TEXT,
    name TEXT,
    display_name TEXT,
    photo_url TEXT,
    auth_provider TEXT DEFAULT 'firebase',
    github_username TEXT,
    github_access_token TEXT,
    github_token_encrypted TEXT,
    github_connected_at TIMESTAMPTZ,
    career_goal TEXT DEFAULT 'ai_engineer',
    active_goal TEXT DEFAULT 'ai_engineer',
    gemini_api_key TEXT,
    gemini_model TEXT DEFAULT 'gemini-1.5-flash',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    data JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_users_github_username ON users(github_username);

-- ====================================================================
-- TABLE 2: scans
-- Append-only audit history of every repository scan & scoring run
-- ====================================================================
CREATE TABLE IF NOT EXISTS scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id TEXT UNIQUE NOT NULL,
    firebase_uid TEXT NOT NULL,
    formula_version TEXT DEFAULT 'v1.0',
    is_cold_start BOOLEAN DEFAULT FALSE,
    repo_count INTEGER DEFAULT 0,
    total_commits INTEGER DEFAULT 0,
    scores JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    data JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_scans_firebase_uid ON scans(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_scans_scan_id ON scans(scan_id);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at);

-- ====================================================================
-- TABLE 3: skill_scores
-- Current verified scores per user derived from GitHub and baseline quiz
-- ====================================================================
CREATE TABLE IF NOT EXISTS skill_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT UNIQUE NOT NULL,
    scan_id TEXT,
    source TEXT DEFAULT 'github',
    formula_version TEXT DEFAULT 'v1.0',
    is_cold_start BOOLEAN DEFAULT FALSE,
    scores JSONB DEFAULT '[]'::jsonb,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    data JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_skill_scores_firebase_uid ON skill_scores(firebase_uid);

-- ====================================================================
-- TABLE 4: github_analysis
-- Cached GitHub repository and commit telemetry (1-hour cache TTL)
-- ====================================================================
CREATE TABLE IF NOT EXISTS github_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT UNIQUE NOT NULL,
    repository_count INTEGER DEFAULT 0,
    languages JSONB DEFAULT '{}'::jsonb,
    commit_count INTEGER DEFAULT 0,
    last_activity_at TIMESTAMPTZ,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    data JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_github_analysis_firebase_uid ON github_analysis(firebase_uid);

-- ====================================================================
-- TABLE 5: roadmaps
-- AI-generated learning roadmaps with weekly milestones and tasks
-- ====================================================================
CREATE TABLE IF NOT EXISTS roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT UNIQUE NOT NULL,
    career_goal TEXT DEFAULT 'ai_engineer',
    week INTEGER,
    topic TEXT,
    weeks JSONB DEFAULT '[]'::jsonb,
    tasks JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    data JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_roadmaps_firebase_uid ON roadmaps(firebase_uid);

-- ====================================================================
-- TABLE 6: resources
-- Curated learning resources (documentation, videos, interactive courses)
-- ====================================================================
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id TEXT,
    skill TEXT,
    type TEXT,
    title TEXT,
    url TEXT,
    is_free BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    data JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_resources_skill ON resources(skill);

-- ====================================================================
-- TABLE 7: resource_feedback
-- Learner feedback ("not helpful" / upvotes) for ranking adjustment
-- ====================================================================
CREATE TABLE IF NOT EXISTS resource_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT NOT NULL,
    resource_id TEXT,
    skill TEXT,
    helpful BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    data JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_resource_feedback_user ON resource_feedback(firebase_uid);

-- ====================================================================
-- TABLE 8: projects
-- Curated project ideas with difficulty rating & required skills
-- ====================================================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id TEXT UNIQUE,
    name TEXT,
    title TEXT,
    description TEXT,
    difficulty TEXT,
    required_skills JSONB DEFAULT '[]'::jsonb,
    data JSONB DEFAULT '{}'::jsonb
);

-- ====================================================================
-- TABLE 9: user_projects
-- Learner project tracking (suggested, in_progress, completed)
-- ====================================================================
CREATE TABLE IF NOT EXISTS user_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT NOT NULL,
    project_id TEXT NOT NULL,
    title TEXT,
    description TEXT,
    difficulty TEXT,
    skills JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'suggested',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    data JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT uq_user_project UNIQUE (firebase_uid, project_id)
);

CREATE INDEX IF NOT EXISTS idx_user_projects_firebase_uid ON user_projects(firebase_uid);

-- ====================================================================
-- TABLE 10: mentor_conversations
-- Grounded multi-turn AI mentor chat history
-- ====================================================================
CREATE TABLE IF NOT EXISTS mentor_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT UNIQUE NOT NULL,
    messages JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    data JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_mentor_conversations_firebase_uid ON mentor_conversations(firebase_uid);

-- ====================================================================
-- TABLE 11: oauth_states
-- Server-side CSRF state tokens for GitHub OAuth handshakes
-- ====================================================================
CREATE TABLE IF NOT EXISTS oauth_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state TEXT UNIQUE NOT NULL,
    firebase_uid TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);

-- ====================================================================
-- TABLE 12: resumes
-- Resume analysis and skills verification cross-matching
-- ====================================================================
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT UNIQUE NOT NULL,
    filename TEXT,
    analysis JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    data JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_resumes_firebase_uid ON resumes(firebase_uid);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS and grant service_role and backend API keys full access
-- ====================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service_role or all on users') THEN
        CREATE POLICY "Allow service_role or all on users" ON users FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service_role or all on scans') THEN
        CREATE POLICY "Allow service_role or all on scans" ON scans FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service_role or all on skill_scores') THEN
        CREATE POLICY "Allow service_role or all on skill_scores" ON skill_scores FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service_role or all on github_analysis') THEN
        CREATE POLICY "Allow service_role or all on github_analysis" ON github_analysis FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service_role or all on roadmaps') THEN
        CREATE POLICY "Allow service_role or all on roadmaps" ON roadmaps FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service_role or all on resources') THEN
        CREATE POLICY "Allow service_role or all on resources" ON resources FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service_role or all on resource_feedback') THEN
        CREATE POLICY "Allow service_role or all on resource_feedback" ON resource_feedback FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service_role or all on projects') THEN
        CREATE POLICY "Allow service_role or all on projects" ON projects FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service_role or all on user_projects') THEN
        CREATE POLICY "Allow service_role or all on user_projects" ON user_projects FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service_role or all on mentor_conversations') THEN
        CREATE POLICY "Allow service_role or all on mentor_conversations" ON mentor_conversations FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service_role or all on oauth_states') THEN
        CREATE POLICY "Allow service_role or all on oauth_states" ON oauth_states FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service_role or all on resumes') THEN
        CREATE POLICY "Allow service_role or all on resumes" ON resumes FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ====================================================================
-- GRANT ROLES PERMISSIONS (Required for Supabase API / PostgREST)
-- ====================================================================
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

