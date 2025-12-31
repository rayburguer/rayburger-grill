import { User } from '../types';

/**
 * Maps database snake_case columns to TypeScript camelCase
 */
export function mapDbUserToApp(dbUser: any): User {
    return {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        lastName: dbUser.last_name,
        phone: dbUser.phone,
        passwordHash: dbUser.password_hash,
        referralCode: dbUser.referral_code,
        referredByCode: dbUser.referred_by_code,
        walletBalance_usd: dbUser.wallet_balance_usd || 0,
        lifetimeSpending_usd: dbUser.lifetime_spending_usd || 0,
        points: dbUser.points || 0,
        loyaltyTier: dbUser.loyalty_tier || 'Bronze',
        role: dbUser.role || 'customer',
        registrationDate: dbUser.registration_date,
        registeredVia: dbUser.registered_via,
        birthDate: dbUser.birth_date,
        lastSpinDate: dbUser.last_spin_date,
        lastSurveyDate: dbUser.last_survey_date,
        nextPurchaseMultiplier: dbUser.next_purchase_multiplier,
        fingerprint: dbUser.fingerprint,
        orders: dbUser.orders || [],
        referralStats: dbUser.referral_stats
    };
}

/**
 * Maps TypeScript camelCase to database snake_case
 */
export function mapAppUserToDb(appUser: Partial<User>): any {
    const dbUser: any = {};

    if (appUser.id !== undefined) dbUser.id = appUser.id;
    if (appUser.email !== undefined) dbUser.email = appUser.email;
    if (appUser.name !== undefined) dbUser.name = appUser.name;
    if (appUser.lastName !== undefined) dbUser.last_name = appUser.lastName;
    if (appUser.phone !== undefined) dbUser.phone = appUser.phone;
    if (appUser.passwordHash !== undefined) dbUser.password_hash = appUser.passwordHash;
    if (appUser.referralCode !== undefined) dbUser.referral_code = appUser.referralCode;
    if (appUser.referredByCode !== undefined) dbUser.referred_by_code = appUser.referredByCode;
    if (appUser.walletBalance_usd !== undefined) dbUser.wallet_balance_usd = appUser.walletBalance_usd;
    if (appUser.lifetimeSpending_usd !== undefined) dbUser.lifetime_spending_usd = appUser.lifetimeSpending_usd;
    if (appUser.points !== undefined) dbUser.points = appUser.points;
    if (appUser.loyaltyTier !== undefined) dbUser.loyalty_tier = appUser.loyaltyTier;
    if (appUser.role !== undefined) dbUser.role = appUser.role;
    if (appUser.registrationDate !== undefined) dbUser.registration_date = appUser.registrationDate;
    if (appUser.registeredVia !== undefined) dbUser.registered_via = appUser.registeredVia;
    if (appUser.birthDate !== undefined) dbUser.birth_date = appUser.birthDate;
    if (appUser.lastSpinDate !== undefined) dbUser.last_spin_date = appUser.lastSpinDate;
    if (appUser.lastSurveyDate !== undefined) dbUser.last_survey_date = appUser.lastSurveyDate;
    if (appUser.nextPurchaseMultiplier !== undefined) dbUser.next_purchase_multiplier = appUser.nextPurchaseMultiplier;
    if (appUser.fingerprint !== undefined) dbUser.fingerprint = appUser.fingerprint;
    if (appUser.orders !== undefined) dbUser.orders = appUser.orders;
    if (appUser.referralStats !== undefined) dbUser.referral_stats = appUser.referralStats;

    return dbUser;
}
