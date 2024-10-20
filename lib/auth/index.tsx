'use client';

import React, { createContext, useContext, useState, useEffect,  ReactNode, use
} from 'react';
import { User } from '@/lib/db/schema';
import { getUser } from '../db/queries';

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({
    children,
    userPromise,
  }: {
    children: ReactNode;
    userPromise: Promise<User | null>;
  }) {

    let initialUser = use(userPromise);
    let [user, setUser] = useState<User | null>(initialUser);

    useEffect(() => {
        setUser(initialUser);
    }, [initialUser]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}