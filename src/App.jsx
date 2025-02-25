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
    const apiUrl = 'https://my-worker.africancontent807.workers.dev/'; // Replace with your Cloud Run URL

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${apiUrl}/api/data`);
                setData(response.data);
            } catch (error) {
                console.error('Error fetching data:', error);
                // Handle the error appropriately (e.g., show an error message)
            }
        };
        fetchData();
    }, [apiUrl]); // Add apiUrl as dependency

    const handleRegister = async () => {
        try {
            await axios.post(`${apiUrl}/api/users/register`, { username, email, password });
            alert('Registration successful!');
        } catch (error) {
            if (error.response && error.response.data && error.response.data.error) {
                alert(error.response.data.error);
            } else {
                alert('Registration failed.');
                console.error('Registration error:', error);
            }
        }
    };

    const handleLogin = async () => {
        try {
            await axios.post(`${apiUrl}/api/users/login`, { username: loginUsername, password: loginPassword });
            alert('Login successful!');
        } catch (error) {
            if (error.response && error.response.data && error.response.data.error) {
                alert(error.response.data.error);
            } else {
                alert('Login failed.');
                console.error('Login error:', error);
            }
        }
    };

    return (
        <div>
            <h1>Social Media App</h1>
            {data && <pre>{JSON.stringify(data, null, 2)}</pre>}

            <h2>Register</h2>
            <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button onClick={handleRegister}>Register</button>

            <h2>Login</h2>
            <input placeholder="Username" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} />
            <input type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
            <button onClick={handleLogin}>Login</button>
        </div>
    );
}

export default App;
