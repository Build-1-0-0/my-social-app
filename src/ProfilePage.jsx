import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';

const ProfilePage = () => {
  const { username } = useParams();
  const apiUrl = `https://my-worker.africancontent807.workers.dev/api/profile/${username}`;
  const [profile, setProfile] = useState(null);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [mediaMessage, setMediaMessage] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            window.location.href = '/login';
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        setProfile(json);
        setBioInput(json.bio || '');
      } catch (e) {
        setError(e.message);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const response = await fetch(`https://my-worker.africancontent807.workers.dev/api/media/${username}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setMedia(data);
        } else {
          throw new Error('Failed to fetch media');
        }
      } catch (e) {
        console.error('Error fetching media:', e);
        setError('Failed to load media: ' + e.message);
      }
    };

    fetchMedia();
  }, [username]);

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image exceeds 10MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }
    setError(null);
    setMediaMessage('Uploading...');
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch(`https://my-worker.africancontent807.workers.dev/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (data.error) {
        setError(data.error);
        setMediaMessage('');
        return;
      }
      setMediaMessage('Profile picture uploaded!');
      return data.media_id;
    } catch (err) {
      setError('Upload failed: ' + err.message);
      setMediaMessage('');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    let profilePictureId = null;
    if (file) {
      profilePictureId = await handleUpload();
      if (!profilePictureId) return;
    }
    setError(null);
    try {
      const response = await fetch(`https://my-worker.africancontent807.workers.dev/api/profile/${username}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bio: bioInput.trim() || null,
          profilePictureId,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setIsEditingBio(false);
      setFile(null);
      setMediaMessage('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError('Failed to update profile: ' + err.message);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile);
    } else {
      setError('Please drop an image file.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto my-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg" role="alert">
          Error loading profile: {error}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto my-8">
        <p className="text-center text-gray-600 text-lg">Profile not found.</p>
      </div>
    );
  }

  const isOwnProfile = localStorage.getItem('username') === profile.username;

  return (
    <div className="max-w-3xl mx-auto my-8">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-6">
            Profile of <span className="text-indigo-600">{profile.username}</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">User Details</h3>
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {profile.profilePictureUrl ? (
                    <img
                      src={`https://my-worker.africancontent807.workers.dev/api/media/${profile.profilePictureUrl}`}
                      alt={`${profile.username}'s profile picture`}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                      No Image
                    </div>
                  )}
                  {isOwnProfile && (
                    <div
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 hover:opacity-100 transition-opacity"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <label htmlFor="profilePicInput" className="cursor-pointer text-white text-sm">
                        Upload
                      </label>
                      <input
                        id="profilePicInput"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="hidden"
                        ref={fileInputRef}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Username</p>
                  <p className="text-lg text-gray-900">{profile.username}</p>
                </div>
              </div>
              <p className="mt-4 text-sm font-medium text-gray-500">Email</p>
              <p className="text-lg text-gray-900">{profile.email}</p>
              <p className="mt-4 text-sm font-medium text-gray-500">Bio</p>
              {isOwnProfile && isEditingBio ? (
                <div className="mt-2">
                  <textarea
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                    rows="4"
                    maxLength={500}
                    placeholder="Tell us about yourself..."
                  />
                  <div className="mt-2 flex space-x-2">
                    <button
                      onClick={handleUpdateProfile}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
                      disabled={isUploading}
                      aria-label="Save profile changes"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingBio(false);
                        setBioInput(profile.bio || '');
                        setFile(null);
                        setMediaMessage('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      aria-label="Cancel bio edit"
                    >
                      Cancel
                    </button>
                  </div>
                  {file && (
                    <div className="mt-2">
                      <p className="text-sm text-indigo-600">Selected: {file.name}</p>
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Profile picture preview"
                        className="mt-2 w-24 h-24 rounded-full object-cover"
                      />
                    </div>
                  )}
                  {isUploading && (
                    <div className="mt-2 flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-600"></div>
                    </div>
                  )}
                  {mediaMessage && (
                    <div className="mt-2 text-green-600 bg-green-100 p-2 rounded" role="alert">
                      {mediaMessage}
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-lg text-gray-900">
                  {profile.bio || 'No bio provided.'}
                  {isOwnProfile && (
                    <button
                      onClick={() => setIsEditingBio(true)}
                      className="ml-2 text-indigo-600 hover:text-indigo-800 text-sm"
                      aria-label="Edit bio"
                    >
                      Edit
                    </button>
                  )}
                </p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Actions</h3>
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              {isOwnProfile ? (
                <p className="text-gray-600">Manage your profile using the edit options.</p>
              ) : (
                <p className="text-gray-600">Viewing {profile.username}'s profile.</p>
              )}
            </div>
          </div>
        </div>

        {media.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">Uploaded Media</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {media.map((item) => (
                <MediaItem key={item.media_id} item={item} token={localStorage.getItem('token')} apiUrl={apiUrl} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link to="/" className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

function MediaItem({ item, token, apiUrl }) {
  const [mediaUrl, setMediaUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const response = await fetch(`https://my-worker.africancontent807.workers.dev/api/media/${item.media_id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (!data.error) {
          setMediaUrl(data.url);
        }
      } catch (err) {
        console.error('Media fetch failed:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMedia();
  }, [item.media_id, token]);

  if (isLoading) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
        <div className="bg-gray-200 animate-pulse rounded-lg w-full h-40"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {mediaUrl && item.mime_type.startsWith('image/') ? (
        <img
          src={mediaUrl}
          alt={`Media ${item.media_id}`}
          className="w-full h-40 object-cover rounded-lg mb-2 hover:scale-105 transition-transform"
        />
      ) : mediaUrl && item.mime_type.startsWith('video/') ? (
        <video
          src={mediaUrl}
          controls
          className="w-full h-40 object-cover rounded-lg mb-2"
        />
      ) : (
        <div className="w-full h-40 bg-gray-200 rounded-lg mb-2 flex items-center justify-center text-gray-500">
          No Preview
        </div>
      )}
      <p className="text-sm text-gray-600 truncate">{item.media_id}</p>
      <p className="text-xs text-gray-500">{item.mime_type}</p>
      <a
        href={mediaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-indigo-600 text-sm hover:underline"
      >
        View / Download
      </a>
    </div>
  );
}

export default ProfilePage;