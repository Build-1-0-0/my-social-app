import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { MyContext } from './MyContext';

const apiUrl = 'https://my-worker.africancontent807.workers.dev/';

const Register = () => {
const [username, setUsername] = useState('');
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState(null);
const { login } = useContext(MyContext);
const navigate = useNavigate();

const handleSubmit = async (e) => {
e.preventDefault();
setError(null);
if (!username.trim() || !email.trim() || !password.trim()) {
setError('Username, email, and password are required');
return;
}
try {
const response = await fetch(`${apiUrl}api/users/register`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ username, email, password }),
});
const data = await response.json();
console.log('Register response:', { status: response.status, data });
if (!response.ok) {
throw new Error(data.error || `HTTP error! status: ${response.status}`);
}
if (!data.token || data.token.split('.').length !== 3) {
throw new Error('Invalid token format received');
}
login(data.token, data.username);
navigate('/');
} catch (err) {
console.error('Register error:', err.message);
setError(err.message);
}
};

return (

<div> <h2>Register</h2> <form onSubmit={handleSubmit}> <input type=\"text\" value={username} onChange={(e) => setUsername(e.target.value)} placeholder=\"Username\" required /> <input type=\"email\" value={email} onChange={(e) => setEmail(e.target.value)} placeholder=\"Email\" required /> <input type=\"password\" value={password} onChange={(e) => setPassword(e.target.value)} placeholder=\"Password\" required /> <button type=\"submit\">Register</button> </form> {error && <p style={{ color: 'red' }}>{error}</p>} </div> ); };
export default Register;
