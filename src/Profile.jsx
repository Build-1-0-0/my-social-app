import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Import useParams

const ProfilePage = () => {
  const { username } = useParams(); // Get the username from the URL parameter
  // *** CORRECTED apiUrl - using template literals to build the API endpoint URL ***
  const apiUrl = `https://my-worker.africancontent807.workers.dev/api/profile/${username}`;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(apiUrl); // <--- Using the CORRECTED apiUrl here
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        setProfile(json);
      } catch (e) {
        setError(e);
        setProfile(null); // Clear profile data on error
        console.error("Fetch error:", e); // Log detailed error to console
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]); // useEffect dependency on username

  if (loading) {
    return <p>Loading profile...</p>;
  }

  if (error) {
    return <p>Error loading profile: {error.message}</p>;
  }

  if (!profile) {
    return <p>Profile not found.</p>;
  }

  return (
    <div>
      <h1>Social Media App</h1>
      <h2>Profile of {profile.username}</h2>
      <p>Username: {profile.username}</p>
      <p>Email: {profile.email}</p>
      {/* ... display other profile information ... */}
      <p><a href="/profile/edit">Edit Profile (Placeholder)</a></p>
      <p><a href="/">https://my-social-app.pages.dev/profile/{profile.username} from this page</a></p>
    </div>
  );
};

export default ProfilePage;
