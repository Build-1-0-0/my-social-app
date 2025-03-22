import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import PostList from './PostList';
import ProfilePage from './ProfilePage';
import UserTable from './UserTable';

const apiUrl = 'https://my-worker.africancontent807.workers.dev/';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [posts, setPosts] = useState([]);
    const [comments, setComments] = useState([]);
    const [data, setData] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsLoggedIn(true);
            fetchPosts();
            fetchComments();
            fetchUserData();
        }
    }, []); // Runs only once on mount

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
        navigate('/');
    };

    const fetchPosts = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${apiUrl}api/posts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setPosts(await response.json());
            } else {
                console.error('Failed to fetch posts:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    };

    const createPost = async (content) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${apiUrl}api/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ content }),
            });
            if (response.ok) {
                fetchPosts();
            } else {
                console.error('Failed to create post:', response.statusText);
            }
        } catch (error) {
            console.error('Error creating post:', error);
        }
    };

    const fetchComments = async (postId = '') => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${apiUrl}api/comments${postId ? `?postId=${postId}` : ''}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setComments(await response.json());
            } else {
                console.error('Failed to fetch comments:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const createComment = async (postId, content) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${apiUrl}api/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ postId, content }),
            });
            if (response.ok) {
                fetchComments(postId);
            } else {
                console.error('Failed to create comment:', response.statusText);
            }
        } catch (error) {
            console.error('Error creating comment:', error);
        }
    };

    const fetchUserData = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${apiUrl}api/data`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setData(await response.json());
            } else {
                console.error('Failed to fetch user data:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    return (
        <Router>
            <div>
                {/* Navigation Bar */}
                <nav>
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        {isLoggedIn ? (
                            <>
                                <li><Link to="/profile/me">Profile</Link></li>
                                <li><button onClick={handleLogout}>Logout</button></li>
                            </>
                        ) : (
                            <li><Link to="/login">Login</Link></li>
                        )}
                    </ul>
                </nav>

                {/* Page Routes */}
                <Routes>
                    <Route 
                        path="/" 
                        element={
                            isLoggedIn 
                                ? <PostList posts={posts} comments={comments} fetchComments={fetchComments} createComment={createComment} createPost={createPost} />
                                : <h2>Please Login</h2>
                        } 
                    />
                    <Route path="/profile/:username" element={<ProfilePage />} />
                    <Route 
                        path="/login" 
                        element={
                            <LoginForm handleLogin={handleLogin} />
                        } 
                    />
                </Routes>

                {/* Show user table if logged in */}
                {isLoggedIn && data && <UserTable data={data} />}
            </div>
        </Router>
    );
}

// Placeholder Login Form
const LoginForm = ({ handleLogin }) => {
    const fakeLogin = () => {
        handleLogin('test-token', 'TestUser'); // Replace with real login logic
    };

    return (
        <div>
            <h2>Login</h2>
            <button onClick={fakeLogin}>Login</button>
        </div>
    );
};

export default App;