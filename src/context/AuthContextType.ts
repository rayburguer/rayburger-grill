import { createContext } from 'react';
import { User } from '../types';

export interface AuthContextType {
    currentUser: User | null;
    registeredUsers: User[];
    login: (identifier: string, password: string) => Promise<User | null>;
    logout: () => void;
    register: (newUser: User) => Promise<boolean>;
    updateUsers: (users: User[]) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
