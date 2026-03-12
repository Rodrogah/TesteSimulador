
import { User } from '../types';

const USER_SESSION_KEY = 'nba_career_user_session';
const USERS_DB_KEY = 'nba_users_database';

interface StoredUser extends User {
    password: string;
}

const getUsersDB = (): StoredUser[] => {
    const db = localStorage.getItem(USERS_DB_KEY);
    return db ? JSON.parse(db) : [];
};

const saveToDB = (users: StoredUser[]) => {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
};

export const register = async (email: string, password: string): Promise<User | null> => {
    const db = getUsersDB();
    const existingUser = db.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (existingUser) {
        return null; // User already exists
    }

    const newUser: StoredUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        email: email.toLowerCase(),
        password: password
    };
    const updatedDB = [...db, newUser];
    saveToDB(updatedDB);
    
    const sessionUser: User = { id: newUser.id, email: newUser.email };
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(sessionUser));
    return sessionUser;
};

export const login = async (email: string, password: string): Promise<User | null> => {
    const db = getUsersDB();
    const existingUser = db.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (existingUser && existingUser.password === password) {
        const sessionUser: User = { id: existingUser.id, email: existingUser.email };
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(sessionUser));
        return sessionUser;
    }

    return null;
};

export const logout = async (): Promise<void> => {
    localStorage.removeItem(USER_SESSION_KEY);
};

export const getCurrentUser = async (): Promise<User | null> => {
    try {
        const userJson = localStorage.getItem(USER_SESSION_KEY);
        return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
        console.error("Erro ao recuperar sessão do usuário", error);
        return null;
    }
};
