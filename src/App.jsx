// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
    const [data, setData] = useState(null);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const apiUrl = 'https://my-worker.africancontent807.workers.dev/';
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsLoggedIn(true);
            fetchData();
        }
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${apiUrl}api/data`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setData(response.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            setErrorMessage("Failed to fetch data. Please log in.");
            setIsLoggedIn(false);
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        setLoading(true);
        setErrorMessage('');
        setSuccessMessage('');
        try {
            await axios.post(`${apiUrl}api/users/register`, { username, email, password });
            setSuccessMessage('Registration successful! Please log in.');
            setUsername('');
            setEmail('');
            setPassword('');
        } catch (error) {
            if (error.response && error.response.data && error.response.data.error) {
                setErrorMessage(error.response.data.error);
            } else {
                setErrorMessage('Registration failed. Please try again.');
                console.error('Registration error:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        setLoading(true);
        setErrorMessage('');
        setSuccessMessage('');
        try {
            console.log("Login Attempt:", { loginUsername, loginPassword }); // Added logging
            const response = await axios.post(`${apiUrl}api/users/login`, { username: loginUsername, password: loginPassword });
            console.log("Login Response:", response); // Added logging
            setSuccessMessage('Login successful!');
            setLoginUsername('');
            setLoginPassword('');
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                console.log("Token Stored:", localStorage.getItem('token')); // Added logging
                setIsLoggedIn(true);
                fetchData();
            }
        } catch (error) {
            console.error("Login Error:", error); // Added logging
            if (error.response && error.response.data && error.response.data.error) {
                setErrorMessage(error.response.data.error);
            } else {
                setErrorMessage('Login failed. Please check your credentials.');
                console.error('Login error:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Social Media App</h1>
            {loading && <p>Loading...</p>}
            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
            {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
            {isLoggedIn && data && data.map(user => (
                <div key={user.id}>
                    <p>Username: {user.username}</p>
                    <p>Email: {user.email}</p>
                </div>
            ))}

            {!isLoggedIn && (
                <>
                    <h2>Register</h2>
                    <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                    <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button onClick={handleRegister} disabled={loading}>Register</button>

                    <h2>Login</h2>
                    <input placeholder="Username" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} />
                    <input type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                    <button onClick={handleLogin} disabled={loading}>Login</button>
                </>
            )}
        </div>
    );
}

export default App;
