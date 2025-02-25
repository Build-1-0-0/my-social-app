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
    const apiUrl = '/api'; // Adjust if needed

    useEffect(() => {
        axios.get(`${apiUrl}/data`).then(res => setData(res.data)).catch(err => console.error(err));
    }, []);

    const handleRegister = async () => {
        try {
            await axios.post(`${apiUrl}/users/register`, { username, email, password });
            alert('Registration successful!');
        } catch (err) {
            alert(err.response.data.error);
        }
    };

    const handleLogin = async () => {
        try {
            await axios.post(`${apiUrl}/users/login`, { username: loginUsername, password: loginPassword });
            alert('Login successful!');
        } catch (err) {
            alert(err.response.data.error);
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
