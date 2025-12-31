import { renderHook, act } from '@testing-library/react';
import { useCloudSync } from '../useCloudSync';
import { supabase } from '../../lib/supabase';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { User } from '../../types';

describe('useCloudSync', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('merges remote users with local users correctly', async () => {
        const localUser: User = {
            email: 'test@test.com',
            name: 'Local Name',
            phone: '123',
            role: 'customer',
            walletBalance_usd: 10,
            points: 0,
            orders: [{ orderId: 'loc1', timestamp: Date.now(), totalUsd: 10, items: [], status: 'pending', paymentStatus: 'pending', customerName: 'Local', customerPhone: '123', rewardsEarned_usd: 0, pointsEarned: 0, deliveryMethod: 'pickup', deliveryFee: 0, paymentMethod: 'whatsapp_link', balanceUsed_usd: 0 }]
        };

        localStorage.setItem('rayburger_registered_users', JSON.stringify([localUser]));

        const remoteUser = {
            email: 'test@test.com',
            name: 'Remote Name',
            phone: '123',
            role: 'customer',
            walletBalance_usd: 20, // Remote has more money
            points: 0,
            orders: [{ orderId: 'loc1', timestamp: Date.now(), totalUsd: 10, items: [], status: 'approved', paymentStatus: 'paid', customerName: 'Remote', customerPhone: '123', rewardsEarned_usd: 0, pointsEarned: 0, deliveryMethod: 'pickup', deliveryFee: 0, paymentMethod: 'whatsapp_link', balanceUsed_usd: 0 }]
        };

        (supabase.from as any).mockImplementation((table: string) => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({ data: { value: 35 }, error: null }))
                })),
                then: (resolve: any) => resolve({ data: (table === 'rb_users' ? [remoteUser] : []), error: null })
            }))
        }));

        const { result } = renderHook(() => useCloudSync());

        await act(async () => {
            await result.current.pullFromCloud();
        });

        const storedUsers = JSON.parse(localStorage.getItem('rayburger_registered_users') || '[]');
        expect(storedUsers).toHaveLength(1);
        const merged = storedUsers[0];

        expect(merged.name).toBe('Remote Name');
        expect(merged.walletBalance_usd).toBe(20); // Should prefer max/remote
        expect(merged.orders[0].status).toBe('approved'); // Should prefer approved over pending
    });

    it('protects valid names from being overwritten by default names', async () => {
        const localUser: User = {
            email: 'test@test.com',
            name: 'Real Name',
            phone: '123',
            role: 'customer',
            walletBalance_usd: 10,
            points: 0,
            orders: []
        };

        localStorage.setItem('rayburger_registered_users', JSON.stringify([localUser]));

        const remoteUser = {
            email: 'test@test.com',
            name: 'Cliente Nuevo', // Default name in remote
            phone: '123',
            role: 'customer',
            walletBalance_usd: 10,
            points: 0,
            orders: []
        };

        (supabase.from as any).mockImplementation((table: string) => ({
            select: vi.fn(() => ({
                then: (resolve: any) => resolve({ data: (table === 'rb_users' ? [remoteUser] : []), error: null })
            }))
        }));

        const { result } = renderHook(() => useCloudSync());

        await act(async () => {
            await result.current.pullFromCloud();
        });

        const storedUsers = JSON.parse(localStorage.getItem('rayburger_registered_users') || '[]');
        expect(storedUsers[0].name).toBe('Real Name'); // Should protect the real name
    });
});
