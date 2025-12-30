-- SECURITY MIGRATION: SECURE WALLET TRANSACTIONS
-- Run this in your Supabase SQL Editor to create the secure transaction function.

-- 1. Create the RPC function to handle wallet payments atomically
create or replace function process_wallet_payment(
  p_user_id text,
  p_amount numeric
) 
returns json 
language plpgsql 
security definer -- Run as superuser to bypass RLS for the update, but we check logic inside
as $$
declare
  current_balance numeric;
  new_balance numeric;
  affected_rows int;
begin
  -- 1. Lock the user row to prevent race conditions (Double Spending)
  -- "FOR UPDATE" ensures no other transaction can modify this user until we finish
  select walletBalance_usd into current_balance
  from rb_users
  where id = p_user_id
  for update;

  -- 2. Validate User Exists
  if not found then
    return json_build_object('success', false, 'error', 'User not found');
  end if;

  -- 3. Validate Balance
  if current_balance < p_amount then
     return json_build_object('success', false, 'error', 'Insufficient funds');
  end if;

  -- 4. Deduct Balance
  new_balance := current_balance - p_amount;

  update rb_users
  set walletBalance_usd = new_balance
  where id = p_user_id;

  -- 5. Return Success
  return json_build_object(
    'success', true, 
    'new_balance', new_balance,
    'deducted', p_amount
  );

exception when others then
  -- Catch unexpected errors
  return json_build_object('success', false, 'error', SQLERRM);
end;
$$;

-- 2. Create RPC function to safely award rewards (Server-Side)
create or replace function award_loyalty_rewards(
  p_user_id text,
  p_amount_spent numeric,
  p_reward_earned numeric
)
returns json
language plpgsql
security definer
as $$
declare
  v_current_spend numeric;
  v_current_balance numeric;
  v_new_spend numeric;
  v_new_balance numeric;
begin
  -- Update stats atomically
  update rb_users
  set 
    lifetimeSpending_usd = coalesce(lifetimeSpending_usd, 0) + p_amount_spent,
    walletBalance_usd = coalesce(walletBalance_usd, 0) + p_reward_earned
  where id = p_user_id
  returning lifetimeSpending_usd, walletBalance_usd 
  into v_new_spend, v_new_balance;

  if not found then
      return json_build_object('success', false, 'error', 'User not found');
  end if;

  return json_build_object(
    'success', true,
    'new_lifetime_spend', v_new_spend,
    'new_wallet_balance', v_new_balance
  );
end;
$$;

-- Grant execute permissions to public (authenticated and anon need to call these)
GRANT EXECUTE ON FUNCTION process_wallet_payment(text, numeric) TO public;
GRANT EXECUTE ON FUNCTION award_loyalty_rewards(text, numeric, numeric) TO public;
