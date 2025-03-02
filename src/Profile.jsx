import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Import useParams

const apiUrl = 'https://my-worker.africancontent807.workers.dev/'; // Replace with your actual API URL

function Profile() {
    const { username } = useParams(); // Get username from URL params
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`https://my-worker.africancontent807.workers.dev/api/profile/${username}`);
                if (response.ok) {
                    const profileData = await response.json();
                    setProfile(profileData);
                } else if (response.status === 404) {
                    setError('Profile not found');
                } else {
                    const errorData = await response.json();
                    setError(`Failed to fetch profile: ${errorData.error || 'Unknown error'}`);
                }
            } catch (err) {
                setError('Failed to fetch profile. Please check console for details.');
                console.error('Error fetching profile:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [username]); // useEffect dependency on username from URL

    if (loading) {
        return <p>Loading profile...</p>;
    }

    if (error) {
        return <p>Error: {error}</p>;
    }

    if (!profile) {
        return null; // Or a message like "Profile not found"
    }

    return (
        <div className="mt-8 p-4 border rounded">
            <h2 className="text-xl font-semibold mb-2">Profile of {profile.username}</h2>
            <p><strong>Username:</strong> {profile.username}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            {profile.bio && <p><strong>Bio:</strong> {profile.bio}</p>}
            {profile.profilePictureUrl && (
                <div>
                    <strong>Profile Picture:</strong><br />
                    <img src={profile.profilePictureUrl} alt={`${profile.username}'s Profile`} className="mt-2 max-w-xs rounded-full" />
                </div>
            )}
            <button
                onClick={() => alert('Edit profile functionality will be implemented next!')}
                className="mt-4 bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
            >
                Edit Profile (Placeholder)
            </button>
        </div>
    );
}

export default Profile;
