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
            setErrorMessage("");
        } catch (error) {
            console.error('Error fetching data:', error);
            setErrorMessage("Session expired or invalid. Please log in again.");
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
            setSuccessMessage('Registration successful! You can now log in.');
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
            const response = await axios.post(`${apiUrl}api/users/login`, { username: loginUsername, password: loginPassword });
            setSuccessMessage('Login successful!');
            setLoginUsername('');
            setLoginPassword('');
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                setIsLoggedIn(true);
                fetchData();
            }
        } catch (error) {
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

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setData(null);
        setSuccessMessage("Logged out successfully.");
    };

    return (
        <div>
            <h1>Social Media App</h1>
            {loading && <p>Loading...</p>}
            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
            {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}

            {isLoggedIn && (
                <>
                    <button onClick={handleLogout}>Logout</button>
                    {data && data.length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Email</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((user) => (
                                    <tr key={user.id}>
                                        <td>{user.username}</td>
                                        <td>{user.email}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>No user data available.</p>
                    )}
                </>
            )}

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
