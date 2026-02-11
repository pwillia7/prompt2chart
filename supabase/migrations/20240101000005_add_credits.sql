-- Credits system: user balances and transaction audit trail

-- User credit balances
create table public.user_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 20,
  stripe_customer_id text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.user_credits enable row level security;

-- Users can read their own credits
create policy "Users can view own credits"
  on public.user_credits for select
  using (auth.uid() = user_id);

-- Credit transaction audit trail
create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  balance_after integer not null,
  reason text not null,
  metadata jsonb default '{}',
  created_at timestamp with time zone default now()
);

alter table public.credit_transactions enable row level security;

-- Users can read their own transactions
create policy "Users can view own transactions"
  on public.credit_transactions for select
  using (auth.uid() = user_id);

-- Auto-create credit row on new user signup
create or replace function public.handle_new_user_credits()
returns trigger as $$
begin
  insert into public.user_credits (user_id, balance)
  values (new.id, 20);
  insert into public.credit_transactions (user_id, amount, balance_after, reason)
  values (new.id, 20, 20, 'signup_bonus');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created_credits
  after insert on auth.users
  for each row execute function public.handle_new_user_credits();

-- Function to atomically deduct credits (called by edge functions via service role)
create or replace function public.deduct_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_metadata jsonb default '{}'
)
returns table (success boolean, remaining integer) as $$
declare
  v_balance integer;
begin
  -- Lock the row to prevent race conditions
  select balance into v_balance
  from public.user_credits
  where user_id = p_user_id
  for update;

  -- Create row if it doesn't exist (for users who signed up before credits system)
  if not found then
    insert into public.user_credits (user_id, balance)
    values (p_user_id, 20);
    v_balance := 20;
  end if;

  if v_balance < p_amount then
    return query select false, v_balance;
    return;
  end if;

  update public.user_credits
  set balance = balance - p_amount, updated_at = now()
  where user_id = p_user_id;

  insert into public.credit_transactions (user_id, amount, balance_after, reason, metadata)
  values (p_user_id, -p_amount, v_balance - p_amount, p_reason, p_metadata);

  return query select true, v_balance - p_amount;
end;
$$ language plpgsql security definer;

-- Function to add credits (called by webhook via service role)
create or replace function public.add_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_metadata jsonb default '{}'
)
returns integer as $$
declare
  v_new_balance integer;
begin
  -- Create row if it doesn't exist
  insert into public.user_credits (user_id, balance)
  values (p_user_id, 0)
  on conflict (user_id) do nothing;

  update public.user_credits
  set balance = balance + p_amount, updated_at = now()
  where user_id = p_user_id
  returning balance into v_new_balance;

  insert into public.credit_transactions (user_id, amount, balance_after, reason, metadata)
  values (p_user_id, p_amount, v_new_balance, p_reason, p_metadata);

  return v_new_balance;
end;
$$ language plpgsql security definer;
