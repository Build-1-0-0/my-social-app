// src/MyContext.jsx
import React, { createContext, useState } from 'react';

export const MyContext = createContext();

export const MyContextProvider = ({ children }) => {
    const [someValue, setSomeValue] = useState('initialValue');

    const updateSomeValue = (newValue) => {
        setSomeValue(newValue);
    };

    return (
        <MyContext.Provider value={{ someValue, updateSomeValue }}>
            {children}
        </MyContext.Provider>
    );
};
