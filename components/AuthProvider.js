'use client';

import { SessionProvider } from 'next-auth/react';

export default function AuthProvider({ children }) {
    return (
        <SessionProvider
            // Refetch session every 5 minutes to check if it's still valid
            refetchInterval={5 * 60}
            // Refetch session when window is focused
            refetchOnWindowFocus={true}
        >
            {children}
        </SessionProvider>
    );
}
