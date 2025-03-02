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
    <div className="container mx-auto p-8 bg-gray-100 rounded-lg shadow-xl"> {/* Styled Container */}
        <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl mb-4"> {/* Styled Main Heading */}
                Welcome to the Profile of <span className="text-indigo-600">{profile.username}</span>
            </h1>
            <p className="mt-2 text-lg text-gray-700"> {/* Styled Tagline/Subheading */}
                Explore user profiles and connect with others!
            </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2"> {/* Grid Layout for Profile Info */}
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">User Details</h3> {/* Section Heading */}
                <div className="bg-white shadow overflow-hidden rounded-md"> {/* Card-like Container for Details */}
                    <div className="px-4 py-5 sm:p-6">
                        <p className="text-sm font-medium text-gray-500">Username:</p> {/* Label */}
                        <p className="mt-1 text-lg text-gray-900">{profile.username}</p> {/* Value */}
                        <p className="mt-4 text-sm font-medium text-gray-500">Email:</p> {/* Label */}
                        <p className="mt-1 text-lg text-gray-900">{profile.email}</p> {/* Value */}
                        {/* ... more profile details (bio, etc.) ... */}
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Actions</h3> {/* Actions Section Heading */}
                <div className="bg-white shadow overflow-hidden rounded-md"> {/* Card-like Container for Actions */}
                    <div className="px-4 py-5 sm:p-6">
                        <p>
                            <a
                                href="/profile/edit"
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" /* More Styled Button! */
                            >
                                Edit Profile
                            </a>
                            <span className="ml-2 text-gray-500">(Placeholder)</span>
                        </p>
                        {/* ... more action buttons ... */}
                    </div>
                </div>
            </div>
        </div>

        <div className="mt-8 text-center"> {/* Centered Home Link */}
            <a href="/" className="text-indigo-600 hover:underline">Back to Home</a>
        </div>
    </div>
);
};

export default ProfilePage;
