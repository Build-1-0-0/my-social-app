import React, { useState, useEffect } from 'react';
import './index.css'; // Assuming you have this for styling
import { verifyToken } from './utils/jwtUtils'; // Assuming you have jwtUtils.js for token verification

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
    const [currentProfileUsername, setCurrentProfileUsername] = useState(null); // NEW STATE: To track username for profile view
    const [profile, setProfile] = useState(null); // NEW STATE: To store fetched profile data

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && verifyToken(token)) { // Assume verifyToken function exists in utils/jwtUtils.js
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
                localStorage.setItem('token', data.token);
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
        setIsLoggedIn(false);
        setData(null); // Clear data table on logout
        setPosts([]);     // Clear posts on logout
        setComments({});    // Clear comments on logout
        setProfile(null);   // Clear profile data on logout
        setCurrentProfileUsername(null); // Reset profile username
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
                fetchPosts(); // Refresh posts after posting
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
            return; // Exit early if no or invalid token
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
                // Optionally handle error, e.g., setPosts([]) or display an error message to the user
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
                // Optimistically update comments or refetch
                fetchComments(postId); // Refresh comments for this post
                document.getElementById(`comment-input-${postId}`).value = ''; // Clear input
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

    // ====================== NEW FUNCTION: fetchUserProfile ======================
    const fetchUserProfile = async (usernameToFetch) => {
        try {
            const response = await fetch(`${apiUrl}api/profile/${usernameToFetch}`);
            if (response.ok) {
                const profileData = await response.json();
                setProfile(profileData); // Store fetched profile data in state
                setCurrentProfileUsername(usernameToFetch); // Track the username whose profile is being viewed
            } else if (response.status === 404) {
                alert('Profile not found.');
                setProfile(null); // Clear profile if not found
                setCurrentProfileUsername(usernameToFetch); // Still track the attempted username
            } else {
                const errorData = await response.json();
                alert(`Failed to fetch profile: ${errorData.error || 'Unknown error'}`);
                setProfile(null); // Clear profile on error
                setCurrentProfileUsername(usernameToFetch); // Still track the attempted username
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            alert('Failed to fetch profile. Check console for details.');
            setProfile(null); // Clear profile on error
            setCurrentProfileUsername(usernameToFetch); // Still track the attempted username
        }
    };
    // ====================== NEW FUNCTION: fetchUserProfile END ==================

    // ====================== NEW FUNCTION: handleViewProfile =====================
    const handleViewProfile = (usernameToView) => {
        fetchUserProfile(usernameToView); // Call fetchUserProfile when "View Profile" is clicked
    };
    // ====================== NEW FUNCTION: handleViewProfile END =================

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Social Media App</h1>

            {isLoggedIn ? (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={handleLogout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Logout</button>
                        {/* ====================== NEW: View Own Profile Button (Placeholder) ================= */}
                        <button
                            onClick={() => handleViewProfile(localStorage.getItem('username'))} // Assuming you store username in localStorage on login
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            View My Profile (Placeholder)
                        </button>
                        {/* ====================== NEW: View Own Profile Button END ========================== */}
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
                                        {/* ====================== NEW: Link to View User Profile ====================== */}
                                        <a href="#" onClick={(e) => { e.preventDefault(); handleViewProfile(post.username); }} className="text-blue-500 hover:underline">
                                            {post.username}
                                        </a>
                                        {/* ====================== NEW: Link to View User Profile END ================== */}
                                    </p>
                                    <p>{post.content}</p>

                                    {/* Comments Section */}
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
                                        {/* ====================== NEW: Link to View User Profile in Table ================= */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <a href="#" onClick={(e) => { e.preventDefault(); handleViewProfile(item.username); }} className="text-blue-500 hover:underline">
                                                {item.username}
                                            </a>
                                        </td>
                                        {/* ====================== NEW: Link to View User Profile in Table END ================== */}
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

                    {/* ====================== NEW SECTION: Profile Display ========================== */}
                    {profile && currentProfileUsername && (
                        <div className="mt-8 p-4 border rounded">
                            <h2 className="text-xl font-semibold mb-2">Profile of {currentProfileUsername}</h2>
                            <p><strong>Username:</strong> {profile.username}</p>
                            <p><strong>Email:</strong> {profile.email}</p>
                            {profile.bio && <p><strong>Bio:</strong> {profile.bio}</p>}
                            {profile.profilePictureUrl && (
                                <div>
                                    <strong>Profile Picture:</strong><br />
                                    <img src={profile.profilePictureUrl} alt={`${profile.username}'s Profile`} className="mt-2 max-w-xs rounded-full" />
                                </div>
                            )}
                            {/* ====================== NEW: Edit Profile Button (Placeholder) ================= */}
                            <button
                                onClick={() => alert('Edit profile functionality will be implemented next!')} // Placeholder action
                                className="mt-4 bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Edit Profile (Placeholder)
                            </button>
                            {/* ====================== NEW: Edit Profile Button END ========================== */}
                        </div>
                    )}
                    {/* ====================== NEW SECTION: Profile Display END ====================== */}

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
