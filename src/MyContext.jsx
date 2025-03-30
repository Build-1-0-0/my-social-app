// src/MyContext.jsx
import React, { createContext, useState } from 'react';

export const MyContext = createContext();

export const MyContextProvider = ({ children }) => {
    const [authState, setAuthState] = useState({
        isLoggedIn: false,
        token: null,
        username: null,
        error: null
    });

    const login = (token, username) => {
        // Validate token format
        if (token && token.split('.').length === 3) {
            setAuthState({
                isLoggedIn: true,
                token,
                username,
                error: null
            });
            localStorage.setItem('token', token);
            localStorage.setItem('username', username);
        } else {
            setAuthState(prev => ({
                ...prev,
                error: 'Invalid token format'
            }));
        }
    };

    const logout = () => {
        setAuthState({
            isLoggedIn: false,
            token: null,
            username: null,
            error: null
        });
        localStorage.removeItem('token');
        localStorage.removeItem('username');
    };

    const setAuthError = (error) => {
        setAuthState(prev => ({ ...prev, error }));
    };

    return (
        <MyContext.Provider value={{ 
            authState, 
            login, 
            logout, 
            setAuthError 
        }}>
            {children}
        </MyContext.Provider>
    );
};