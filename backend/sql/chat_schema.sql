-- /* EKLENDİ */ — Chat + admin notifications (run after sql/schema.sql on existing DB)

CREATE TYPE conversation_type AS ENUM ('driver_admin', 'rider_admin');
CREATE TYPE message_sender_type AS ENUM ('admin', 'driver', 'rider');

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type conversation_type NOT NULL,
  driver_id UUID REFERENCES drivers (id) ON DELETE CASCADE,
  rider_id UUID REFERENCES users (id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_conversation_party CHECK (
    (type = 'driver_admin' AND driver_id IS NOT NULL AND rider_id IS NULL)
    OR (type = 'rider_admin' AND rider_id IS NOT NULL AND driver_id IS NULL)
  )
);

CREATE UNIQUE INDEX idx_conv_driver_admin ON conversations (admin_id, driver_id)
  WHERE type = 'driver_admin' AND driver_id IS NOT NULL;
CREATE UNIQUE INDEX idx_conv_rider_admin ON conversations (admin_id, rider_id)
  WHERE type = 'rider_admin' AND rider_id IS NOT NULL;

CREATE INDEX idx_conversations_admin ON conversations (admin_id, updated_at DESC);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  sender_type message_sender_type NOT NULL,
  sender_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  message TEXT NOT NULL CHECK (char_length(message) > 0 AND char_length(message) <= 8000),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages (conversation_id, created_at ASC);

CREATE TABLE admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type VARCHAR(64) NOT NULL DEFAULT 'chat_message',
  title VARCHAR(255) NOT NULL,
  body TEXT,
  payload JSONB,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_notifications_user ON admin_notifications (admin_user_id, is_read, created_at DESC);

CREATE OR REPLACE FUNCTION bump_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET updated_at = NOW() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_messages_bump_conversation
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE PROCEDURE bump_conversation_on_message();

CREATE TRIGGER tr_conversations_updated BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
