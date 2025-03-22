import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
// Assuming these components exist in your project (update paths if needed)
import PostList from './components/PostList';
import ProfilePage from './components/ProfilePage';
import UserTable from './components/UserTable';

const apiUrl = 'https://my-worker.africancontent807.workers.dev/'; // Your backend API URL

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [posts, setPosts] = useState();
    const [comments, setComments] = useState();
    const [data, setData] = useState(null); // State to hold user data

    const navigate = useNavigate(); // Hook for programmatic navigation

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsLoggedIn(true);
            fetchPosts();
            fetchComments();
            fetchData(); // Fetch user data when logged in
        }
    },);

    const handleLogin = (token, username) => {
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);
        setIsLoggedIn(true);
        fetchPosts();
        fetchComments();
        fetchData(); // Fetch user data after login
        navigate('/'); // Navigate to the homepage after login
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setIsLoggedIn(false);
        setData(null); // Clear user data on logout
        navigate('/'); // Navigate to the homepage after logout
    };

    const fetchPosts = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await fetch(`${apiUrl}api/posts`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
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
        }
    };

    const createPost = async (content) => {
        const token = localStorage.getItem('token');
        if (token) {
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
                    fetchPosts(); // Refresh posts after creating a new one
                } else {
                    console.error('Failed to create post:', response.status, response.statusText);
                }
            } catch (error) {
                console.error('Error creating post:', error);
            }
        }
    };

    const fetchComments = async (postId) => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                let url = `${apiUrl}api/comments`;
                if (postId) {
                    url += `?postId=${postId}`;
                }
                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                if (response.ok) {
                    const commentsData = await response.json();
                    setComments(commentsData);
                } else {
                    console.error('Failed to fetch comments:', response.status, response.statusText);
                }
            } catch (error) {
                console.error('Error fetching comments:', error);
            }
        }
    };

    const createComment = async (postId, content) => {
        const token = localStorage.getItem('token');
        if (token) {
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
                    fetchComments(postId); // Refresh comments after creating a new one
                } else {
                    console.error('Failed to create comment:', response.status, response.statusText);
                }
            } catch (error) {
                console.error('Error creating comment:', error);
            }
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
                    const userData = await response.json();
                    setData(userData);
                    console.log("Fetched user data:", userData);
                } else {
                    console.error('Failed to fetch data:', response.status, response.statusText);
                    const errorText = await response.text();
                    console.error('Failed to fetch data body:', errorText);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }
    };

    return (
        <div>
            <BrowserRouter>
                <nav>
                    <ul>
                        <li><a href="/">Home</a></li>
                        {isLoggedIn ? (
                            <>
                                <li><a href="/profile/me">Profile</a></li>
                                <li><button onClick={handleLogout}>Logout</button></li>
                            </>
                        ) : (
                            <li><a href="/login">Login</a></li>
                        )}
                    </ul>
                </nav>

                <Routes>
                    <Route path="/" element={isLoggedIn ? <PostList posts={posts} comments={comments} fetchComments={fetchComments} createComment={createComment} createPost={createPost} /> : <div>Please Login</div>} />
                    <Route path="/profile/:username" element={<ProfilePage />} />
                    <Route path="/login" element={<div>Login Form Here (Implement your login logic and call handleLogin)</div>} /> {/* Replace with your actual Login component */}
                </Routes>

                {isLoggedIn && data && <UserTable data={data} />} {/* Render UserTable when logged in and data is available */}
            </BrowserRouter>
        </div>
    );
}

export default App;