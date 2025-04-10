// src/App.jsx
import React, { useEffect, useState, useContext } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { MyContext } from './MyContext';
import PostList from './PostList';
import ProfilePage from './ProfilePage';
import UserTable from './UserTable';
import Register from './Register';
import ErrorBoundary from './ErrorBoundary';
import './index.css';

const apiUrl = 'https://my-worker.africancontent807.workers.dev/'; // Matches Worker URL

const App = () => {
  const { authState, login, logout, setAuthError } = useContext(MyContext);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    if (token && username && token.split('.').length === 3) {
      login(token, username);
      fetchPosts();
      fetchUserData();
    } else if (token) {
      logout();
    }
  }, [login, logout]);

  const fetchPosts = async () => {
    if (!authState.token) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}api/posts`, {
        headers: { 'Authorization': `Bearer ${authState.token}` },
      });
      console.log('fetchPosts response:', response.status);
      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate('/login');
          return;
        }
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      setPosts(await response.json());
    } catch (error) {
      setAuthError(error.message);
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createPost = async (content) => {
    if (!authState.token) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`,
        },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      await fetchPosts();
    } catch (error) {
      setAuthError(error.message);
      console.error('Error creating post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async (postId) => {
    if (!authState.token || !postId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}api/comments?postId=${postId}`, {
        headers: { 'Authorization': `Bearer ${authState.token}` },
      });
      console.log('fetchComments response:', response.status, 'postId:', postId);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      setComments(await response.json());
    } catch (error) {
      setAuthError(error.message);
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createComment = async (postId, content) => {
    if (!authState.token) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}api/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`,
        },
        body: JSON.stringify({ postId, content }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      await fetchComments(postId);
    } catch (error) {
      setAuthError(error.message);
      console.error('Error creating comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserData = async () => {
    if (!authState.token) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}api/data`, {
        headers: { 'Authorization': `Bearer ${authState.token}` },
      });
      console.log('fetchUserData response:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      setData(await response.json());
    } catch (error) {
      setAuthError(error.message);
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (token, username) => {
    login(token, username);
    fetchPosts();
    fetchUserData();
    navigate('/');
  };

  const handleLogout = () => {
    logout();
    setPosts([]);
    setComments([]);
    setData(null);
    navigate('/login');
  };

  return (
    <ErrorBoundary>
      <div>
        <nav>
          <ul>
            <li><Link to="/">Home</Link></li>
            {authState.isLoggedIn ? (
              <>
                <li><Link to={`/profile/${authState.username}`}>Profile</Link></li>
                <li><button onClick={handleLogout}>Logout</button></li>
              </>
            ) : (
              <>
                <li><Link to="/login">Login</Link></li>
                <li><Link to="/register">Register</Link></li>
              </>
            )}
          </ul>
          {authState.error && <p style={{ color: 'red' }}>{authState.error}</p>}
        </nav>

        {isLoading && <p>Loading...</p>}

        <Routes>
          <Route
  path="/"
  element={
    authState.isLoggedIn ? (
      <PostList
        posts={posts}
        setPosts={setPosts}
        comments={comments}
        setComments={setComments}
        fetchComments={fetchComments}
        createComment={createComment}
        createPost={createPost}
        currentUsername={authState.username}
        token={authState.token}
        apiUrl={apiUrl} // Pass apiUrl prop
      />
    ) : (
      <h2>Please Login</h2>
    )
  }
/>
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/login" element={<LoginForm handleLogin={handleLogin} />} />
          <Route path="/register" element={<Register />} />
        </Routes>

        {authState.isLoggedIn && data && <UserTable data={data} />}
      </div>
    </ErrorBoundary>
  );
};

const LoginForm = ({ handleLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }
    try {
      console.log('Login attempt:', { username });
      const response = await fetch(`${apiUrl}api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      console.log('Login fetch response:', { status: response.status, ok: response.ok });
      const data = await response.json();
      console.log('Login response data:', data);
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      if (!data.token || data.token.split('.').length !== 3) {
        throw new Error('Invalid token format received');
      }
      handleLogin(data.token, data.username);
    } catch (err) {
      console.error('Login error:', err.message);
      setError(`Failed to login: ${err.message}`);
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

export default App;