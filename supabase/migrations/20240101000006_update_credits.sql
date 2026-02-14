-- Update credits system: 100 signup bonus, new pack amounts, monthly free credits

-- Add columns for monthly credit tracking and paid user status
alter table public.user_credits
  add column if not exists ever_purchased boolean not null default false,
  add column if not exists last_monthly_credit timestamp with time zone;

-- Update default balance for new rows
alter table public.user_credits alter column balance set default 100;

-- Update signup trigger: 20 → 100 free credits
create or replace function public.handle_new_user_credits()
returns trigger as $$
begin
  insert into public.user_credits (user_id, balance)
  values (new.id, 100);
  insert into public.credit_transactions (user_id, amount, balance_after, reason)
  values (new.id, 100, 100, 'signup_bonus');
  return new;
end;
$$ language plpgsql security definer;

-- Update deduct_credits fallback balance: 20 → 100
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
    values (p_user_id, 100);
    v_balance := 100;
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

-- Monthly free credits: 20 credits/month after the first month
-- Only for users with balance < 100 OR who have ever purchased
create or replace function public.grant_monthly_credits(p_user_id uuid)
returns void as $$
declare
  v_row public.user_credits%rowtype;
begin
  select * into v_row
  from public.user_credits
  where user_id = p_user_id;

  if not found then
    return;
  end if;

  -- Must be registered for at least 30 days (skip first month)
  if v_row.created_at > now() - interval '30 days' then
    return;
  end if;

  -- Must not have received monthly credits in the last 30 days
  if v_row.last_monthly_credit is not null
     and v_row.last_monthly_credit > now() - interval '30 days' then
    return;
  end if;

  -- Only grant if balance < 100 or user has ever purchased
  if v_row.balance >= 100 and v_row.ever_purchased = false then
    return;
  end if;

  -- Grant 20 monthly credits
  perform public.add_credits(p_user_id, 20, 'monthly_bonus');

  update public.user_credits
  set last_monthly_credit = now()
  where user_id = p_user_id;
end;
$$ language plpgsql security definer;
