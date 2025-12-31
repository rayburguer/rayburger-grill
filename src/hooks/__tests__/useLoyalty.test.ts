import { renderHook } from '@testing-library/react';
import { useLoyalty } from '../useLoyalty';
import { User, CartItem } from '../../types';
import { describe, it, expect } from 'vitest';

describe('useLoyalty', () => {
    const mockUsers: User[] = [
        {
            email: 'buyer@test.com',
            name: 'Buyer',
            phone: '123456',
            role: 'customer',
            loyaltyTier: 'Bronze',
            walletBalance_usd: 10,
            points: 0,
            orders: [],
            referralCode: 'BUYER123',
            registrationDate: Date.now()
        },
        {
            email: 'referrer@test.com',
            name: 'Referrer',
            phone: '654321',
            role: 'customer',
            referralCode: 'REF123',
            points: 0,
            walletBalance_usd: 0,
            orders: []
        }
    ];

    const mockCart: CartItem[] = [
        { id: '1', name: 'Burger', price_usd: 10, finalPrice_usd: 10, quantity: 1, selectedOptions: [] }
    ];

    it('calculates 3% reward for Bronze tier', () => {
        const { result } = renderHook(() => useLoyalty());
        const processResult = result.current.processOrderRewards(
            'buyer@test.com',
            mockCart,
            10,
            mockUsers
        );

        expect(processResult?.orderSummary.rewardEarned).toBe(0.3); // 10 * 0.03
    });

    it('calculates 5% reward for Silver tier', () => {
        const silverUsers = [...mockUsers];
        silverUsers[0] = { ...silverUsers[0], loyaltyTier: 'Silver' };

        const { result } = renderHook(() => useLoyalty());
        const processResult = result.current.processOrderRewards(
            'buyer@test.com',
            mockCart,
            10,
            silverUsers
        );

        expect(processResult?.orderSummary.rewardEarned).toBe(0.5); // 10 * 0.05
    });

    it('applies 3x multiplier for FUNDADOR code within 30 days', () => {
        const fundadorUsers = [...mockUsers];
        fundadorUsers[0] = {
            ...fundadorUsers[0],
            referredByCode: 'FUNDADOR',
            registrationDate: Date.now() - (5 * 24 * 60 * 60 * 1000) // 5 days ago
        };

        const { result } = renderHook(() => useLoyalty());
        const processResult = result.current.processOrderRewards(
            'buyer@test.com',
            mockCart,
            10,
            fundadorUsers
        );

        // Bronze (3%) * 10$ * 3 = 0.9$
        expect(processResult?.orderSummary.rewardEarned).toBeCloseTo(0.9);
    });

    it('does NOT apply 3x multiplier for FUNDADOR code after 30 days', () => {
        const oldUsers = [...mockUsers];
        oldUsers[0] = {
            ...oldUsers[0],
            referredByCode: 'FUNDADOR',
            registrationDate: Date.now() - (31 * 24 * 60 * 60 * 1000) // 31 days ago
        };

        const { result } = renderHook(() => useLoyalty());
        const processResult = result.current.processOrderRewards(
            'buyer@test.com',
            mockCart,
            10,
            oldUsers
        );

        // Bronze (3%) * 10$ = 0.3$
        expect(processResult?.orderSummary.rewardEarned).toBeCloseTo(0.3);
    });

    it('calculates referrer bonus (2%) correctly', () => {
        const referredUsers = [...mockUsers];
        referredUsers[0] = { ...referredUsers[0], referredByCode: 'REF123' };

        const { result } = renderHook(() => useLoyalty());
        const processResult = result.current.processOrderRewards(
            'buyer@test.com',
            mockCart,
            10,
            referredUsers
        );

        expect(processResult?.orderSummary.referrerReward).toBe(0.2); // 10 * 0.02
    });

    it('updates wallet balance correctly when using balance', () => {
        const { result } = renderHook(() => useLoyalty());
        const processResult = result.current.processOrderRewards(
            'buyer@test.com',
            mockCart,
            10,
            mockUsers,
            undefined,
            5 // Use 5$ from wallet
        );

        const buyer = processResult?.updatedUsers.find(u => u.email === 'buyer@test.com');
        expect(buyer?.walletBalance_usd).toBe(5); // 10 - 5
    });

    it('prevents rewards for admin users', () => {
        const adminUsers = [...mockUsers];
        adminUsers[0] = { ...adminUsers[0], role: 'admin' };

        const { result } = renderHook(() => useLoyalty());
        const processResult = result.current.processOrderRewards(
            'buyer@test.com',
            mockCart,
            10,
            adminUsers
        );

        expect(processResult?.orderSummary.rewardEarned).toBe(0);
    });

    it('checks roulette cooldown correctly', () => {
        const { result } = renderHook(() => useLoyalty());

        const userWithoutSpin: User = { ...mockUsers[0], lastSpinDate: undefined };
        expect(result.current.canSpin(userWithoutSpin)).toBe(true);

        const now = Date.now();
        const userRecentSpin: User = { ...mockUsers[0], lastSpinDate: now - (1000) };
        expect(result.current.canSpin(userRecentSpin)).toBe(false);

        const userOldSpin: User = { ...mockUsers[0], lastSpinDate: now - (8 * 24 * 60 * 60 * 1000) }; // 8 days ago (cooldown is 7)
        expect(result.current.canSpin(userOldSpin)).toBe(true);
    });
});
