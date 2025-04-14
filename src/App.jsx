import React, { useEffect, useState, useContext } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { MyContext } from './MyContext';
import PostList from './PostList';
import ProfilePage from './ProfilePage';
import UserTable from './UserTable';
import Register from './Register';
import ErrorBoundary from './ErrorBoundary';
import './index.css';

const apiUrl = 'https://my-worker.africancontent807.workers.dev/';

const App = () => {
  const { authState, login, logout, setAuthError } = useContext(MyContext);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const [mediaMessage, setMediaMessage] = useState('');
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
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}api/posts`, {
        headers: authState.token ? { 'Authorization': `Bearer ${authState.token}` } : {},
      });
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

  const createPost = async (content, mediaId) => {
    if (!authState.token) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`,
        },
        body: JSON.stringify({ content, mediaId: mediaId || undefined }),
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
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      setComments((prev) => ({ ...prev, [postId]: await response.json() }));
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

  const handleUpload = async (file) => {
    if (!authState.token) {
      setMediaError('Please login to upload.');
      return;
    }
    if (!file) {
      setMediaError('Select a file.');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setMediaError('File exceeds 100MB.');
      return;
    }
    setMediaError('');
    setMediaMessage('');
    const formData = new FormData();
    formData.append('file', file);
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authState.token}` },
        body: formData,
      });
      const data = await response.json();
      if (data.error) {
        setMediaError(data.error);
        return;
      }
      setMediaMessage(`Uploaded! Media ID: ${data.media_id}`);
      return data.media_id;
    } catch (error) {
      setMediaError('Upload failed: ' + error.message);
      console.error('Error uploading media:', error);
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
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-blue-600 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <Link to="/" className="text-xl font-bold">Social App</Link>
            <div className="space-x-4">
              {authState.isLoggedIn ? (
                <>
                  <Link to={`/profile/${authState.username}`} className="hover:underline">Profile</Link>
                  <button onClick={handleLogout} className="hover:underline">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="hover:underline">Login</Link>
                  <Link to="/register" className="hover:underline">Register</Link>
                </>
              )}
            </div>
          </div>
          {authState.error && <p className="text-red-300 mt-2">{authState.error}</p>}
        </nav>

        <div className="container mx-auto p-4">
          {isLoading && <p className="text-gray-600">Loading...</p>}
          {mediaError && <p className="text-red-500 mb-4">{mediaError}</p>}
          {mediaMessage && <p className="text-green-500 mb-4">{mediaMessage}</p>}

          <Routes>
            <Route
              path="/"
              element={
                <PostList
                  posts={posts}
                  setPosts={setPosts}
                  comments={comments}
                  fetchComments={fetchComments}
                  createComment={createComment}
                  createPost={createPost}
                  handleUpload={handleUpload}
                  currentUsername={authState.username}
                  token={authState.token}
                  apiUrl={apiUrl}
                />
              }
            />
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route path="/login" element={<LoginForm handleLogin={handleLogin} />} />
            <Route path="/register" element={<Register />} />
          </Routes>

          {authState.isLoggedIn && data && <UserTable data={data} />}
        </div>
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
      const response = await fetch(`${apiUrl}api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      if (!data.token || data.token.split('.').length !== 3) {
        throw new Error('Invalid token format received');
      }
      handleLogin(data.token, data.username);
    } catch (err) {
      setError(`Failed to login: ${err.message}`);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
          Login
        </button>
      </form>
    </div>
  );
};

export default App;