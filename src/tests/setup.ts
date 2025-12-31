import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
                })),
                order: vi.fn(() => ({
                    limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
                }))
            })),
            upsert: vi.fn(() => Promise.resolve({ error: null })),
            delete: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ error: null })),
                in: vi.fn(() => Promise.resolve({ error: null })),
            })),
            insert: vi.fn(() => Promise.resolve({ error: null })),
            update: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ error: null })),
                in: vi.fn(() => Promise.resolve({ error: null })),
            })),
        })),
        rpc: vi.fn(() => Promise.resolve({ data: { success: true }, error: null })),
        auth: {
            getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
            getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
        },
    },
}));

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value.toString();
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// Mock window.dispatchEvent
window.dispatchEvent = vi.fn();

// Mock console.error to avoid noise in tests unless expected
// vi.spyOn(console, 'error').mockImplementation(() => {});
