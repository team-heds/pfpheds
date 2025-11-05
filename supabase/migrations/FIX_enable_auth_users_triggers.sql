-- =====================================================
-- Ensure auth.users triggers are enabled (persistent)
-- =====================================================
ALTER TABLE auth.users ENABLE TRIGGER USER;
-- Explicitly ensure our profile trigger is enabled
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
