import React, { useState, useEffect } from 'react';
import './index.css';
import { verifyToken } from './utils/jwtUtils';
import { Link, BrowserRouter, Routes, Route } from 'react-router-dom'; // All react-router-dom imports together
import PostList from './PostList';
import UserTable from './UserTable';
import Profile from './Profile'; // Import Profile component

const apiUrl = 'https://my-worker.africancontent807.workers.dev/'; // Replace with your actual API URL

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [registerUsername, setRegisterUsername] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [postContent, setPostContent] = useState('');
    const [posts, setPosts] = useState([]);
    const [data, setData] = useState(null);
    const [comments, setComments] = useState({});


    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && verifyToken(token)) {
            setIsLoggedIn(true);
            fetchPosts();
            fetchData();
        }
    }, []);

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${apiUrl}api/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: registerUsername, email: registerEmail, password: registerPassword }),
            });
            if (response.ok) {
                alert('Registration successful');
                // Optionally, redirect to login form or automatically log them in
            } else {
                const errorData = await response.json();
                alert(`Registration failed: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Failed to register. Please check console for details.');
        }
    };

    const handleLogin = async (e) => {
    e.preventDefault();
    try {
        const response = await fetch(`${apiUrl}api/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });
        if (response.ok) {
            const data = await response.json();
            console.log('Login Data:', data); // <--- ADD THIS LINE HERE - VERY IMPORTANT!
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username); // <----- Store username in localStorage on login!
            setIsLoggedIn(true);
            fetchPosts();
            fetchData();
            alert('Login successful');
        } else {
            const errorData = await response.json();
            alert(`Login failed: ${errorData.error || 'Invalid credentials'}`);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please check console for details.');
    }
};

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username'); // <----- Clear username from localStorage on logout
        setIsLoggedIn(false);
        setData(null);
        setPosts([]);
        setComments({});
        alert('Logged out successfully');
    };

    const handleCreatePost = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please log in to create a post.');
            return;
        }
        try {
            const response = await fetch(`${apiUrl}api/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ content: postContent }),
            });
            if (response.ok) {
                setPostContent('');
                fetchPosts();
                alert('Post created successfully!');
            } else {
                const errorData = await response.json();
                alert(`Failed to create post: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Failed to create post. Please check console for details.');
        }
    };

    const fetchPosts = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('No token found, or invalid token. Cannot fetch posts.');
            return;
        }
        try {
            const response = await fetch(`${apiUrl}api/posts`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            if (response.ok) {
                const postsData = await response.json();
                setPosts(postsData);
            } else {
                console.error('Failed to fetch posts:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    };


    const fetchData = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await fetch(`${apiUrl}api/data`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    setData(data);
                } else {
                    console.error('Failed to fetch data:', response.status, response.statusText);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }
    };

    const createComment = async (postId, content) => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please log in to comment.');
            return;
        }
        try {
            const response = await fetch(`${apiUrl}api/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ postId: postId, content: content }),
            });
            if (response.ok) {
                fetchComments(postId);
                document.getElementById(`comment-input-${postId}`).value = '';
                alert('Comment added successfully!');
            } else {
                const errorData = await response.json();
                alert(`Failed to add comment: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error creating comment:', error);
            alert('Failed to add comment. Please check console for details.');
        }
    };

    const fetchComments = async (postId) => {
        try {
            const response = await fetch(`${apiUrl}api/comments?postId=${postId}`);
            if (response.ok) {
                const commentsData = await response.json();
                setComments(prevComments => ({ ...prevComments, [postId]: commentsData }));
            } else {
                console.error('Failed to fetch comments:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };


    return (
    <BrowserRouter>
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Social Media App</h1>

            {isLoggedIn ? (
                <>
                    {/* ... your logged-in UI (Logout button, Post creation, PostList, UserTable) ... */}
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={handleLogout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Logout</button>
                        <Link to={`/profile/${localStorage.getItem('username')}`}>
                            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                                View My Profile (Placeholder)
                            </button>
                        </Link>
                    </div>

                    <div className="mb-4">
                        {/* ... Post creation textarea and button ... */}
                    </div>

                    <PostList posts={posts} comments={comments} fetchComments={fetchComments} createComment={createComment} />
                    <UserTable data={data} />

                </>
            ) : (
                <div className="flex flex-col md:flex-row gap-4">
                    {/* ... your login and register forms ... */}
                </div>
            )}

            {/*  ADD THE <Routes> AND <Route> HERE, OUTSIDE isLoggedIn BLOCK */}
            <Routes>
                <Route path="/profile/:username" element={<Profile />} />
            </Routes>

        </div>
    </BrowserRouter>
);
}

export default App;
