import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import './index.css';
import { verifyToken } from './utils/jwtUtils';

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
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Social Media App</h1>

            {isLoggedIn ? (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={handleLogout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Logout</button>
                        <Link to={`/profile/${localStorage.getItem('username')}`}>
    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        View My Profile (Placeholder)
    </button>
</Link>
                    </div>

                    <div className="mb-4">
                        <textarea
                            value={postContent}
                            onChange={(e) => setPostContent(e.target.value)}
                            placeholder="Write a post..."
                            className="border p-2 w-full"
                        />
                        <button onClick={handleCreatePost} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Post</button>
                    </div>

                    {posts.length > 0 && (
                        <div className="mb-4">
                            <h2 className="text-xl font-semibold mb-2">Posts</h2>
                            {posts.map(post => (
                                <div key={post.id} className="mb-4 p-4 border rounded">
                                    <p className="font-semibold">
                                        <a href="#" onClick={(e) => { e.preventDefault(); }} className="text-blue-500 hover:underline">
                                            {post.username}
                                        </a>
                                    </p>
                                    <p>{post.content}</p>

                                    <div className="mt-2">
                                        <input
                                            type="text"
                                            id={`comment-input-${post.id}`}
                                            placeholder="Add a comment..."
                                            className="border p-1 w-full mb-2"
                                        />
                                        <button onClick={() => createComment(post.id, document.getElementById(`comment-input-${post.id}`).value)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded">Comment</button>
                                    </div>
                                    <div id={`comments-${post.id}`}>
                                        {comments[post.id] && comments[post.id].map(comment => (
                                            <div key={comment.id} className="p-2 border-t">
                                                <p><span className="font-semibold">{comment.username}:</span> {comment.content}</p>
                                            </div>
                                        ))}
                                        <button onClick={() => fetchComments(post.id)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-1 px-2 rounded mt-1">Load Comments</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {data && data.length > 0 && (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.map(item => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">{item.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <a href="#" onClick={(e) => { e.preventDefault(); }} className="text-blue-500 hover:underline">
                                                {item.username}
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">{item.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button className="bg-blue-200 hover:bg-blue-300 text-blue-800 font-bold py-1 px-2 rounded mr-2">Edit</button>
                                            <button className="bg-red-200 hover:bg-red-300 text-red-800 font-bold py-1 px-2 rounded">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                </>
            ) : (
                <div className="flex flex-col md:flex-row gap-4">
                    <form onSubmit={handleRegister} className="mb-4 md:w-1/2 p-4 border rounded">
                        <h2 className="text-xl font-semibold mb-2">Register</h2>
                        <input type="text" placeholder="Username" value={registerUsername} onChange={e => setRegisterUsername(e.target.value)} className="border p-2 w-full mb-2" required />
                        <input type="email" placeholder="Email" value={registerEmail} onChange={e => setRegisterEmail(e.target.value)} className="border p-2 w-full mb-2" required />
                        <input type="password" placeholder="Password" value={registerPassword} onChange={e => setRegisterPassword(e.target.value)} className="border p-2 w-full mb-2" required />
                        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Register</button>
                    </form>

                    <form onSubmit={handleLogin} className="md:w-1/2 p-4 border rounded">
                        <h2 className="text-xl font-semibold mb-2">Login</h2>
                        <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="border p-2 w-full mb-2" required />
                        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="border p-2 w-full mb-2" required />
                        <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Login</button>
                    </form>
                </div>
            )}
        </div>
    );
}

export default App;
