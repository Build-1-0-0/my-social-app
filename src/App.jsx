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
    const [comments, setComments] = useState({}); // Store comments for each post

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

    const fetchComments = async (postId, token) => {
        try {
            const response = await axios.get(`${apiUrl}api/comments?postId=${postId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setComments(prevComments => ({ ...prevComments, [postId]: response.data }));
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const createComment = async (postId, content, token) => {
        try {
            await axios.post(`${apiUrl}api/comments`, { postId, content }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchComments(postId, token); // Refresh comments after creation
        } catch (error) {
            console.error('Error creating comment:', error);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Social Media App</h1>
            {loading && <p>Loading...</p>}
            {errorMessage && <p className="text-red-500 mb-2">{errorMessage}</p>}
            {successMessage && <p className="text-green-500 mb-2">{successMessage}</p>}

            {!isLoggedIn ? (
                <>
                    <div className="mb-4">
                        <h2 className="text-xl font-semibold mb-2">Register</h2>
                        <input type="text" placeholder="Username" className="border p-2 w-full mb-2" value={username} onChange={(e) => setUsername(e.target.value)} />
                        <input type="email" placeholder="Email" className="border p-2 w-full mb-2" value={email} onChange={(e) => setEmail(e.target.value)} />
                        <input type="password" placeholder="Password" className="border p-2 w-full mb-2" value={password} onChange={(e) => setPassword(e.target.value)} />
                        <button onClick={handleRegister} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Register</button>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold mb-2">Login</h2>
                        <input type="text" placeholder="Username" className="border p-2 w-full mb-2" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} />
                        <input type="password" placeholder="Password" className="border p-2 w-full mb-2" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                        <button onClick={handleLogin} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Login</button>
                    </div>
                </>
            ) : (
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
                                    <input type="text" id={`comment-input-${post.id}`} placeholder="Add a comment..." />
                                    <button onClick={() => createComment(post.id, document.getElementById(`comment-input-${post.id}`).value, localStorage.getItem('token'))}>Comment</button>
                                    <div id={`comments-${post.id}`}>
                                        {comments[post.id] && comments[post.id].map(comment => (
                                            <p key={comment.id}>{comment.username}: {comment.content}</p>
                                        ))}
                                    </div>
                                    <button onClick={() => fetchComments(post.id, localStorage.getItem('token'))}>Load Comments</button>
                                </div>
                            ))}
                        </div>
                    )}

                    {data && data.length > 0 && (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Value</th>
                                    <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Actions</th> {/* Example Header */}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.map(item => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-no-wrap">{item.id}</td>
                                        <td className="px-6 py-4 whitespace-no-wrap">{item.name}</td>
                                        <td className="px-6 py-4 whitespace-no-wrap">{item.value}</td>
                                        <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 font-medium text-gray-900">
                                            {/* Add buttons or actions here if needed */}
                                            <button className="text-indigo-600 hover:text-indigo-900">Edit</button> | <button className="text-red-600 hover:text-red-900">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </>
            )}
        </div>
    );
}

export default App;
