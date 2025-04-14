import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { MyContext } from './MyContext';
import PrivateRoute from './PrivateRoute';
import PostList from './PostList';
import ProfilePage from './ProfilePage';
import Register from './Register';
import Login from './Login';
import UserTable from './UserTable';
import NotFound from './NotFound';

function App() {
  const { authState, logout } = useContext(MyContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex-shrink-0 text-2xl font-bold text-indigo-600">
              MySocialApp
            </Link>
            <div className="flex items-center space-x-4">
              {authState.isLoggedIn ? (
                <>
                  <Link
                    to={`/profile/${authState.username}`}
                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/data"
                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Users
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<PostList />} />
          <Route
            path="/profile/:username"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/data"
            element={
              <PrivateRoute>
                <UserTable />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
