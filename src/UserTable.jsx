import React, { useState, useEffect } from 'react';
import './index.css';
import { verifyToken } from './utils/jwtUtils';
import { Link, BrowserRouter, Routes, Route } from 'react-router-dom';
import PostList from './PostList';
import UserTable from './UserTable'; // Make sure UserTable path is correct
import ProfilePage from './ProfilePage'; // Make sure ProfilePage path is correct

const apiUrl = 'https://my-worker.africancontent807.workers.dev/';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [registerUsername, setRegisterUsername] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [postContent, setPostContent] = useState('');
    const [posts, setPosts] = useState([]);
    const [comments, setComments] = useState({});
    const [data, setData] = useState(null); // <---- ADDED: data state to hold user data, initialize to null


    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && verifyToken(token)) {
            setIsLoggedIn(true);
            fetchPosts();
            fetchData(); // <---- ADDED: Call fetchData() on component mount and login
        }
    }, []);


    const fetchData = async () => { // <---- RE-INTRODUCED fetchData FUNCTION
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await fetch(`${apiUrl}api/data`, { // <---- FETCH USER DATA FROM API
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                if (response.ok) {
                    const userData = await response.json(); // Renamed to userData to avoid confusion
                    setData(userData); // <---- SET THE FETCHED USER DATA TO 'data' STATE!
                    console.log("Fetched user data:", userData); // Log the fetched data for debugging
                } else {
                    console.error('Failed to fetch data:', response.status, response.statusText);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }
    };


    const handleRegister = async (e) => {
        e.preventDefault();
        // ... (rest of your handleRegister function - no changes needed) ...
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
                const loginData = await response.json(); // Renamed to loginData to avoid confusion
                console.log('Login Data:', loginData);
                localStorage.setItem('token', loginData.token);
                localStorage.setItem('username', loginData.username);
                setIsLoggedIn(true);
                fetchPosts();
                fetchData(); // <---- ADDED: Call fetchData() AFTER successful login!
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
        localStorage.removeItem('username');
        setIsLoggedIn(false);
        setData(null); // <---- Clear user data on logout
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
        // ... (rest of your handleCreatePost function - no changes needed) ...
    };

    const fetchPosts = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('No token found, or invalid token. Cannot fetch posts.');
            return;
        }
        // ... (rest of your fetchPosts function - no changes needed) ...
    };


    const createComment = async (postId, content) => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please log in to comment.');
            return;
        }
        // ... (rest of your createComment function - no changes needed) ...
    };

    const fetchComments = async (postId) => {
        // ... (rest of your fetchComments function - no changes needed) ...
    };


    return (
        <BrowserRouter>
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4 text-center">Social Media App</h1>

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
                            {/* Post creation area can be added here or in PostList */}
                        </div>

                        <Routes>
                            <Route path="/" element={<PostList posts={posts} comments={comments} fetchComments={fetchComments} createComment={createComment} />} />
                            <Route path="/profile/:username" element={<ProfilePage />} />
                        </Routes>
                         <UserTable data={data} /> {/* <---- PASSED 'data' STATE AS PROP TO UserTable! */}


                    </>
                ) : (
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Login and Register forms - no changes needed */}
                        <form onSubmit={handleRegister} className="mb-4">
                            <h2 className="text-xl font-semibold mb-2">Register</h2>
                            <input type="text" placeholder="Username" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2" value={registerUsername} onChange={e => setRegisterUsername(e.target.value)} required />
                            <input type="email" placeholder="Email" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2" value={registerEmail} onChange={e => setRegisterEmail(e.target.value)} required />
                            <input type="password" placeholder="Password" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2" value={registerPassword} onChange={e => setRegisterPassword(e.target.value)} required />
                            <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Register</button>
                        </form>

                        <form onSubmit={handleLogin}>
                            <h2 className="text-xl font-semibold mb-2">Login</h2>
                            <input type="text" placeholder="Username" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2" value={username} onChange={e => setUsername(e.target.value)} required />
                            <input type="password" placeholder="Password" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2" value={password} onChange={e => setPassword(e.target.value)} required />
                            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Login</button>
                        </form>
                    </div>
                )}
            </div>
        </BrowserRouter>
    );
}

export default App;
