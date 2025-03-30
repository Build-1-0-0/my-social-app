// src/utils/jwtUtils.js

// Simple token verification for client-side checking
export const verifyToken = (token) => {
    if (!token) {
        return false;
    }
    
    try {
        // Basic token format check (JWTs typically have 3 parts separated by dots)
        const parts = token.split('.');
        if (parts.length !== 3) {
            return false;
        }
        
        // Note: This doesn't verify the signature, just checks existence and basic format
        // Real verification happens on the server
        return true;
    } catch (error) {
        console.error('Token verification error:', error);
        return false;
    }
};

// Helper to get current username from stored token
export const getUsernameFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const payload = token.split('.')[1]; // Get payload part of JWT
        const decoded = atob(payload); // Decode base64
        const { username } = JSON.parse(decoded);
        return username;
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};

export const isTokenExpired = () => {
    const token = localStorage.getItem('token');
    if (!token) return true;

    try {
        const payload = token.split('.')[1];
        const decoded = atob(payload);
        const { exp } = JSON.parse(decoded);
        if (!exp) return false; // If no expiration, assume valid
        return Date.now() >= exp * 1000; // exp is in seconds, Date.now() in milliseconds
    } catch (error) {
        console.error('Error checking token expiration:', error);
        return true; // Assume expired on error
    }
};