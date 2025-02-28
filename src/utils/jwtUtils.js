// src/utils/jwtUtils.js
export const verifyToken = (token) => {
    // In a real application, you would actually verify the JWT token here.
    // For now, for testing, we'll just check if a token exists (is not null or undefined).
    return !!token;
};
