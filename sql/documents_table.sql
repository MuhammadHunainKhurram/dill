-- Legacy SQL file - Database functionality has been removed
-- This application now works without a database backend
-- Files are processed in-memory and results are returned directly

-- If you need to restore database functionality in the future,
-- consider using a simpler approach without authentication:

-- CREATE TABLE documents (
--   id SERIAL PRIMARY KEY,
--   file_name TEXT NOT NULL,
--   path TEXT NOT NULL,
--   size_bytes BIGINT NOT NULL,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
