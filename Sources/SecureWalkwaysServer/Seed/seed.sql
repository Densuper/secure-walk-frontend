-- SQLite seed script to mirror the Swift migration defaults
INSERT INTO users (id, name, email, passwordHash, role)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'Alice Admin', 'admin@securewalk.app', '$2b$12$abcdefghijklmnopqrstuv', 'admin'),
    ('00000000-0000-0000-0000-000000000002', 'Oscar Officer', 'officer@securewalk.app', '$2b$12$abcdefghijklmnopqrstuv', 'officer');
