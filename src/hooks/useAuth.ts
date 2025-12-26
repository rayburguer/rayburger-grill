import { useAuthContext } from '../context/AuthContext';

// Re-export the hook for backward compatibility
export const useAuth = () => {
    return useAuthContext();
};
