-- Create Extension if not exists (for gen_random_uuid in older postgres, but PostgreSQL 13+ has it built-in)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cost NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'annual')),
  category TEXT,
  start_date DATE NOT NULL,
  next_renewal DATE NOT NULL,
  last_used_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user subscriptions lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
-- Index for renewal job lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_renewal ON subscriptions(next_renewal, is_active);

-- Table for tracking password resets
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  attempts INT DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for password resets lookup
CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email, used);

