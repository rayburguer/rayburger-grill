/**
 * Debounce utility for localStorage operations
 * Prevents excessive writes that can cause performance issues
 */

type DebouncedFunction<T extends (...args: any[]) => any> = {
    (...args: Parameters<T>): void;
    cancel: () => void;
};

export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): DebouncedFunction<T> {
    let timeoutId: NodeJS.Timeout | null = null;

    const debouncedFn = (...args: Parameters<T>) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func(...args);
            timeoutId = null;
        }, wait);
    };

    debouncedFn.cancel = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    };

    return debouncedFn;
}

/**
 * Throttle utility - ensures function is called at most once per interval
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean = false;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}

/**
 * Safe localStorage wrapper with error handling
 */
export const safeLocalStorage = {
    getItem: (key: string): string | null => {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.error(`Error reading from localStorage (${key}):`, error);
            return null;
        }
    },

    setItem: (key: string, value: string): boolean => {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            console.error(`Error writing to localStorage (${key}):`, error);
            return false;
        }
    },

    removeItem: (key: string): boolean => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing from localStorage (${key}):`, error);
            return false;
        }
    }
};
