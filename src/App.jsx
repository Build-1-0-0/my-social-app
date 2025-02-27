import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';

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
    const [postContent, setPostContent] = useState('');
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsLoggedIn(true);
            fetchData();
            fetchPosts();
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
            setErrorMessage('');
        } catch (error) {
            console.error('Error fetching data:', error);
            setErrorMessage('Session expired or invalid. Please log in again.');
            setIsLoggedIn(false);
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    };

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${apiUrl}api/posts`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPosts(response.data);
        } catch (error) {
            console.error('Error fetching posts:', error);
            setErrorMessage('Failed to fetch posts.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        setLoading(true);
        setErrorMessage('');
        setSuccessMessage('');
        if (!username || !email || !password) {
            setErrorMessage('Please fill in all fields.');
            setLoading(false);
            return;
        }
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
        if (!loginUsername || !loginPassword) {
            setErrorMessage('Please enter your username and password.');
            setLoading(false);
            return;
        }
        try {
            const response = await axios.post(`${apiUrl}api/users/login`, { username: loginUsername, password: loginPassword });
            setSuccessMessage('Login successful!');
            setLoginUsername('');
            setLoginPassword('');
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                setIsLoggedIn(true);
                fetchData();
                fetchPosts();
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
        setPosts([]);
        setSuccessMessage('Logged out successfully.');
    };

    const handleCreatePost = async () => {
        setLoading(true);
        setErrorMessage('');
        if (!postContent) {
            setErrorMessage('Please enter some content for your post.');
            setLoading(false);
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${apiUrl}api/posts`,
                { content: postContent },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setPosts([response.data, ...posts]);
            setPostContent('');
        } catch (error) {
            setErrorMessage('Failed to create post.');
            console.error('Post creation error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Social Media App</h1>
            {loading && <p>Loading...</p>}
            {errorMessage && <p className="text-red-500 mb-2">{errorMessage}</p>}
            {successMessage && <p className="text-green-500 mb-2">{successMessage}</p>}

            {isLoggedIn && (
                <>
                    <button onClick={handleLogout} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4">Logout</button>

                    <div className="mb-4">
                        <textarea
                            value={postContent}
                            onChange={(e) => setPostContent(e.target.value)}
                            placeholder="Write a post..."
                            className="border p-2 w-full"
                        />
                        <button onClick={handleCreatePost} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-2">Post</button>
                    </div>

                    {posts.length > 0 && (
                        <div className="mb-4">
                            <h2 className="text-xl font-semibold mb-2">Posts</h2>
                            {posts.map((post) => (
                                <div key={post.id} className="border p-2 mb-2">
                                    <p>{post.content}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {data && data.length > 0 && (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                    <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.map((user) => (
                                    <tr key={user.id}>
                                        <td className="px-6 py-4 whitespace-no-wrap">{user.username}</td>
                                        <td className="px-6 py-4 whitespace-no-wrap">{user.email}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </>
            )}

            {!isLoggedIn && (
                <>
                    <h2 className="text-xl font-semibold mt-4">Register</h2>
                    <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="border p-2 w-full mb-2" />
                    <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="border p-2 w-full mb-2" />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="border p-2 w-full mb-2" />
                    <button onClick={handleRegister} disabled={loading} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded>
