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

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const fullUrl = `${apiUrl}api/data`; // Corrected URL construction
                console.log("Full URL:", fullUrl); // Log the full URL
                const response = await axios.get(fullUrl);
                console.log("API Response:", response.data);
                setData(response.data);
                console.log("Data State:", response.data);
            } catch (error) {
                console.error('Error fetching data:', error);
                if (error.response && error.response.status === 404) {
                    setErrorMessage("404: Resource not found.");
                } else {
                    setErrorMessage("Failed to fetch data.");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [apiUrl]);

    const handleRegister = async () => {
        setLoading(true);
        setErrorMessage('');
        setSuccessMessage('');
        try {
            await axios.post(`${apiUrl}api/users/register`, { username, email, password });
            setSuccessMessage('Registration successful!');
            setUsername('');
            setEmail('');
            setPassword('');
        } catch (error) {
            if (error.response && error.response.data && error.response.data.error) {
                setErrorMessage(error.response.data.error);
            } else {
                setErrorMessage('Registration failed.');
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
            await axios.post(`${apiUrl}api/users/login`, { username: loginUsername, password: loginPassword });
            setSuccessMessage('Login successful!');
            setLoginUsername('');
            setLoginPassword('');
        } catch (error) {
            if (error.response && error.response.data && error.response.data.error) {
                setErrorMessage(error.response.data.error);
            } else {
                setErrorMessage('Login failed.');
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
            {data && <pre>{JSON.stringify(data, null, 2)}</pre>}

            <h2>Register</h2>
            <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} id="registerUsername" name="registerUsername"/>
            <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} id="registerEmail" name="registerEmail"/>
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} id="registerPassword" name="registerPassword"/>
            <button onClick={handleRegister} disabled={loading}>Register</button>

            <h2>Login</h2>
            <input placeholder="Username" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} id="loginUsername" name="loginUsername"/>
            <input type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} id="loginPassword" name="loginPassword"/>
            <button onClick={handleLogin} disabled={loading}>Login</button>
        </div>
    );
}

export default App;
