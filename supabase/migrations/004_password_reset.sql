create table if not exists password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  used boolean default false,
  created_at timestamptz default now()
);
create index if not exists idx_prt_token on password_reset_tokens(token);
create index if not exists idx_prt_user on password_reset_tokens(user_id);
