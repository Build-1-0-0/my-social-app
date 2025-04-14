import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import jwtDecode from 'jwt-decode';
import { MyContext } from './MyContext';

const apiUrl = 'https://my-worker.africancontent807.workers.dev/';

const Register = () => {
  const { authState, login, setAuthError } = useContext(MyContext);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setAuthError(null);
  }, [setAuthError]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setSuccessMessage('');

    // Validation
    if (!username.trim() || !email.trim() || !password.trim()) {
      setAuthError('Username, email, and password are required');
      return;
    }
    if (!emailRegex.test(email)) {
      setAuthError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      console.log('Register response:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || `Registration failed: ${response.status}`);
      }

      // Validate JWT
      const decoded = jwtDecode(data.token);
      if (!decoded || !decoded.exp) {
        throw new Error('Invalid token format received');
      }

      // Success
      setSuccessMessage('Registration successful! Redirecting...');
      login(data.token, data.username);

      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err) {
      console.error('Register error:', err.message);
      setAuthError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Register</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset disabled={isLoading}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter username"
                required
                aria-invalid={authState.error ? 'true' : 'false'}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter email"
                required
                aria-invalid={authState.error ? 'true' : 'false'}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter password"
                  required
                  aria-invalid={authState.error ? 'true' : 'false'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-3 text-sm text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          </fieldset>

          {authState.error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg" role="alert">
              {authState.error}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg" role="status">
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
            aria-label="Register"
          >
            {isLoading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-center text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;