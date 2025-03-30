import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import PostList from './PostList';
import ProfilePage from './ProfilePage';
import UserTable from './UserTable';
import './index.css';

const apiUrl = 'https://my-worker.africancontent807.workers.dev/';

const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [posts, setPosts] = useState([]);
    const [comments, setComments] = useState([]);
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsLoggedIn(true);
            fetchPosts();
            fetchComments();
            fetchUserData();
        }
    }, []);

    const handleLogin = (token, username) => {
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);
        setIsLoggedIn(true);
        fetchPosts();
        fetchComments();
        fetchUserData();
        navigate('/');
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setIsLoggedIn(false);
        setData(null);
        setPosts([]);
        setComments([]);
        navigate('/login');
    };

    const fetchPosts = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setIsLoading(true);
        try {
            const response = await fetch(`${apiUrl}api/posts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            setPosts(await response.json());
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const createPost = async (content) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setIsLoading(true);
        try {
            const response = await fetch(`${apiUrl}api/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ content }),
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            await fetchPosts();
        } catch (error) {
            console.error('Error creating post:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchComments = async (postId = '') => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setIsLoading(true);
        try {
            const response = await fetch(`${apiUrl}api/comments${postId ? `?postId=${postId}` : ''}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            setComments(await response.json());
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const createComment = async (postId, content) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setIsLoading(true);
        try {
            const response = await fetch(`${apiUrl}api/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ postId, content }),
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            await fetchComments(postId);
        } catch (error) {
            console.error('Error creating comment:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUserData = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setIsLoading(true);
        try {
            const response = await fetch(`${apiUrl}api/data`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            setData(await response.json());
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <nav>
                <ul>
                    <li><Link to="/">Home</Link></li>
                    {isLoggedIn ? (
                        <>
                            <li><Link to={`/profile/${localStorage.getItem('username')}`}>Profile</Link></li>
                            <li><button onClick={handleLogout}>Logout</button></li>
                        </>
                    ) : (
                        <li><Link to="/login">Login</Link></li>
                    )}
                </ul>
            </nav>

            {isLoading && <p>Loading...</p>}

            <Routes>
                <Route 
                    path="/" 
                    element={
                        isLoggedIn 
                            ? <PostList 
                                posts={posts} 
                                comments={comments} 
                                fetchComments={fetchComments} 
                                createComment={createComment} 
                                createPost={createPost} 
                              />
                            : <h2>Please Login</h2>
                    } 
                />
                <Route path="/profile/:username" element={<ProfilePage />} />
                <Route 
                    path="/login" 
                    element={<LoginForm handleLogin={handleLogin} />} 
                />
            </Routes>

            {isLoggedIn && data && <UserTable data={data} />}
        </div>
    );
};

const LoginForm = ({ handleLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${apiUrl}api/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            handleLogin(data.token, data.username);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    placeholder="Username" 
                    required 
                />
                <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="Password" 
                    required 
                />
                <button type="submit">Login</button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
};

export default function Root() {
    return (
        <Router>
            <App />
        </Router>
    );
}