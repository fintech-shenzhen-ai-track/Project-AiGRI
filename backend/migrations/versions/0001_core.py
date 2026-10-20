"""0001_core: roles, identity and platform-core tables, RLS helper wiring (feature 01).

Revision ID: 0001_core
Revises:
"""

import os

from alembic import op

from aigri.core.rls import apply_tenant_policy

revision = "0001_core"
down_revision = None
branch_labels = None
depends_on = None

TS = "timestamptz NOT NULL DEFAULT now()"
UUID_PK = "uuid PRIMARY KEY DEFAULT gen_random_uuid()"


def upgrade() -> None:
    app_pw = os.environ.get("AIGRI_APP_PASSWORD", "aigri_app").replace("'", "''")
    # Roles (cluster-wide, so created only if missing). aigri_app owns nothing and has no BYPASSRLS.
    op.execute(
        f"""
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'aigri_owner') THEN
            CREATE ROLE aigri_owner LOGIN CREATEROLE PASSWORD 'aigri_owner';
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'aigri_app') THEN
            CREATE ROLE aigri_app LOGIN NOINHERIT NOBYPASSRLS NOSUPERUSER PASSWORD '{app_pw}';
          END IF;
        END $$
        """
    )
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    op.execute("GRANT USAGE ON SCHEMA public TO aigri_app")

    # ---- Identity and tenancy -------------------------------------------------------------
    op.execute(
        f"""
        CREATE TABLE insurers (
          id {UUID_PK},
          country text NOT NULL,
          code text NOT NULL UNIQUE,
          legal_name text NOT NULL,
          display_name text NOT NULL,
          status text NOT NULL DEFAULT 'verification'
            CHECK (status IN ('verification', 'live', 'paused')),
          live_since timestamptz,
          verification jsonb NOT NULL DEFAULT '{{}}'::jsonb,
          created_at {TS},
          updated_at {TS}
        )"""
    )
    op.execute(
        f"""
        CREATE TABLE users (
          id {UUID_PK},
          phone text UNIQUE,
          email text UNIQUE,
          display_name text,
          honorific text,
          status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'disabled')),
          created_at {TS},
          updated_at {TS},
          CHECK (phone IS NOT NULL OR email IS NOT NULL)
        )"""
    )
    op.execute(
        f"""
        CREATE TABLE clients (
          id {UUID_PK},
          country text NOT NULL,
          kind text NOT NULL CHECK (kind IN ('agri_business', 'individual_farmer')),
          name text NOT NULL,
          business_id text,
          contact_user_id uuid REFERENCES users(id),
          address text,
          admin_area jsonb,
          farms text CHECK (farms IN ('crops', 'livestock', 'both')),
          status text NOT NULL DEFAULT 'active',
          created_at {TS},
          updated_at {TS}
        )"""
    )
    op.execute(
        f"""
        CREATE TABLE memberships (
          id {UUID_PK},
          user_id uuid NOT NULL REFERENCES users(id),
          kind text NOT NULL CHECK (kind IN ('client', 'insurer', 'platform')),
          client_id uuid REFERENCES clients(id),
          insurer_id uuid REFERENCES insurers(id),
          role text NOT NULL CHECK (role IN
            ('client_owner', 'product_manager', 'underwriter_adjuster', 'finance', 'superadmin')),
          granted_by uuid REFERENCES users(id),
          granted_at {TS},
          revoked_at timestamptz,
          created_at {TS},
          updated_at {TS},
          CHECK ((kind = 'client' AND client_id IS NOT NULL AND insurer_id IS NULL)
              OR (kind = 'insurer' AND insurer_id IS NOT NULL AND client_id IS NULL)
              OR (kind = 'platform' AND client_id IS NULL AND insurer_id IS NULL))
        )"""
    )
    # One active role per user per tenant.
    op.execute(
        """
        CREATE UNIQUE INDEX memberships_one_active
          ON memberships (user_id, kind, coalesce(client_id, insurer_id,
            '00000000-0000-0000-0000-000000000000'::uuid))
          WHERE revoked_at IS NULL"""
    )
    op.execute(
        f"""
        CREATE TABLE sessions (
          id text PRIMARY KEY,
          user_id uuid NOT NULL REFERENCES users(id),
          membership_id uuid REFERENCES memberships(id),
          created_at {TS},
          last_seen_at {TS},
          expires_at timestamptz NOT NULL,
          revoked_at timestamptz,
          user_agent text
        )"""
    )
    op.execute(
        f"""
        CREATE TABLE otp_codes (
          id {UUID_PK},
          destination text NOT NULL,
          code_hash text NOT NULL,
          purpose text NOT NULL CHECK (purpose IN ('sign_in', 'payout_account_change')),
          expires_at timestamptz NOT NULL,
          attempts integer NOT NULL DEFAULT 0,
          consumed_at timestamptz,
          created_at {TS}
        )"""
    )
    op.execute("CREATE INDEX otp_codes_destination ON otp_codes (destination, created_at DESC)")
    op.execute(
        f"""
        CREATE TABLE client_consents (
          id {UUID_PK},
          client_id uuid NOT NULL REFERENCES clients(id),
          scope text NOT NULL CHECK (scope IN ('platform_terms', 'insurer_share')),
          insurer_id uuid REFERENCES insurers(id),
          policy_id uuid,
          payload_hash text NOT NULL,
          given_by uuid NOT NULL REFERENCES users(id),
          given_at {TS},
          created_at {TS},
          updated_at {TS}
        )"""
    )

    # ---- Platform core --------------------------------------------------------------------
    op.execute(
        """
        CREATE TABLE audit_events (
          seq bigserial PRIMARY KEY,
          ts timestamptz NOT NULL,
          actor_type text NOT NULL CHECK (actor_type IN
            ('person', 'agent', 'system', 'wallet', 'rule')),
          actor_id uuid,
          actor_label text NOT NULL,
          membership_role text,
          tier smallint CHECK (tier BETWEEN 0 AND 3),
          action text NOT NULL,
          object_type text NOT NULL,
          object_id text NOT NULL,
          insurer_id uuid,
          client_id uuid,
          payload jsonb NOT NULL,
          prev_hash text NOT NULL,
          hash text NOT NULL UNIQUE
        )"""
    )
    op.execute(
        """
        CREATE FUNCTION audit_events_reject_change() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          RAISE EXCEPTION 'audit_events is append-only (% rejected)', TG_OP
            USING ERRCODE = 'insufficient_privilege';
        END $$"""
    )
    op.execute(
        """
        CREATE TRIGGER audit_events_no_update_delete
          BEFORE UPDATE OR DELETE ON audit_events
          FOR EACH ROW EXECUTE FUNCTION audit_events_reject_change()"""
    )
    op.execute(
        """
        CREATE TRIGGER audit_events_no_truncate
          BEFORE TRUNCATE ON audit_events
          FOR EACH STATEMENT EXECUTE FUNCTION audit_events_reject_change()"""
    )
    op.execute(
        f"""
        CREATE TABLE outbox (
          id {UUID_PK},
          topic text NOT NULL,
          payload jsonb NOT NULL,
          created_at {TS},
          published_at timestamptz,
          attempts integer NOT NULL DEFAULT 0,
          dead_at timestamptz,
          last_error text
        )"""
    )
    op.execute("CREATE INDEX outbox_unpublished ON outbox (created_at) WHERE published_at IS NULL")
    op.execute(
        f"""
        CREATE TABLE files (
          id {UUID_PK},
          owner_client_id uuid REFERENCES clients(id),
          owner_insurer_id uuid REFERENCES insurers(id),
          kind text NOT NULL CHECK (kind IN ('evidence_photo', 'policy_pdf', 'vet_certificate',
            'letter', 'ear_tag_photo', 'herd_count_photo')),
          storage_key text NOT NULL UNIQUE,
          mime text NOT NULL,
          bytes bigint NOT NULL,
          sha256 text NOT NULL,
          phash text,
          capture jsonb,
          server_received_at {TS},
          uploaded_by uuid REFERENCES users(id),
          created_at {TS},
          updated_at {TS}
        )"""
    )
    op.execute(
        f"""
        CREATE TABLE clock_state (
          id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
          mode text NOT NULL DEFAULT 'real' CHECK (mode IN ('real', 'demo')),
          story_now timestamptz,
          created_at {TS},
          updated_at {TS}
        )"""
    )
    op.execute("INSERT INTO clock_state (id, mode) VALUES (1, 'real')")
    op.execute(
        f"""
        CREATE TABLE notifications (
          id {UUID_PK},
          user_id uuid NOT NULL REFERENCES users(id),
          channel text NOT NULL CHECK (channel IN ('push', 'sms', 'email', 'in_app')),
          template text NOT NULL,
          payload jsonb NOT NULL DEFAULT '{{}}'::jsonb,
          status text NOT NULL DEFAULT 'queued'
            CHECK (status IN ('queued', 'sent', 'delivered', 'failed')),
          sent_at timestamptz,
          provider_ref text,
          created_at {TS},
          updated_at {TS}
        )"""
    )
    op.execute(
        f"""
        CREATE TABLE push_subscriptions (
          id {UUID_PK},
          user_id uuid NOT NULL REFERENCES users(id),
          endpoint text NOT NULL,
          keys jsonb NOT NULL,
          revoked_at timestamptz,
          created_at {TS},
          updated_at {TS}
        )"""
    )

    # ---- Row-level security ---------------------------------------------------------------
    # Sign-in lookups (users, memberships, sessions, otp_codes) and the insurer roster happen
    # before a tenant is known and carry no tenant policy; their access is code-controlled.
    # audit_events has no policy: appends and chain reads must see the whole chain (see
    # hashing-and-audit.md); reads go through audited views.
    apply_tenant_policy(op.execute, "clients", insurer_col=None, client_col="id")
    apply_tenant_policy(op.execute, "client_consents")
    apply_tenant_policy(
        op.execute, "files", insurer_col="owner_insurer_id", client_col="owner_client_id"
    )
    apply_tenant_policy(op.execute, "notifications", insurer_col=None, client_col=None,
                        user_col="user_id")
    apply_tenant_policy(op.execute, "push_subscriptions", insurer_col=None, client_col=None,
                        user_col="user_id")

    # ---- Grants for the app role ----------------------------------------------------------
    op.execute(
        "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO aigri_app"
    )
    op.execute("GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO aigri_app")
    op.execute("REVOKE UPDATE, DELETE, TRUNCATE ON audit_events FROM aigri_app")
    # Tables created by later migrations (run by the same owner) get the same grants.
    op.execute(
        "ALTER DEFAULT PRIVILEGES IN SCHEMA public "
        "GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO aigri_app"
    )
    op.execute(
        "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO aigri_app"
    )


def downgrade() -> None:
    for table in (
        "push_subscriptions", "notifications", "clock_state", "files", "outbox", "audit_events",
        "client_consents", "otp_codes", "sessions", "memberships", "clients", "users", "insurers",
    ):
        op.execute(f"DROP TABLE IF EXISTS {table} CASCADE")
    op.execute("DROP FUNCTION IF EXISTS audit_events_reject_change()")
