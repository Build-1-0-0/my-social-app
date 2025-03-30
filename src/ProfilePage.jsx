import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const ProfilePage = () => {
    const { username } = useParams();
    const apiUrl = `https://my-worker.africancontent807.workers.dev/api/profile/${username}`;
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(apiUrl, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (!response.ok) {
                    if (response.status === 401) {
                        localStorage.removeItem('token');
                        window.location.href = '/login';
                        return;
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const json = await response.json();
                setProfile(json);
            } catch (e) {
                setError(e.message);
                setProfile(null);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [username]);

    if (loading) {
        return <p className="text-center text-gray-600">Loading profile...</p>;
    }

    if (error) {
        return <p className="text-center text-red-600">Error loading profile: {error}</p>;
    }

    if (!profile) {
        return <p className="text-center text-gray-600">Profile not found.</p>;
    }

    return (
        <div className="container mx-auto p-8 bg-gray-100 rounded-lg shadow-xl">
            <div className="text-center">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
                    Profile of <span className="text-indigo-600">{profile.username}</span>
                </h1>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">User Details</h3>
                    <div className="bg-white shadow rounded-md p-6">
                        <p className="text-sm font-medium text-gray-500">Username:</p>
                        <p className="mt-1 text-lg text-gray-900">{profile.username}</p>
                        <p className="mt-4 text-sm font-medium text-gray-500">Email:</p>
                        <p className="mt-1 text-lg text-gray-900">{profile.email}</p>
                        {profile.bio && (
                            <>
                                <p className="mt-4 text-sm font-medium text-gray-500">Bio:</p>
                                <p className="mt-1 text-lg text-gray-900">{profile.bio}</p>
                            </>
                        )}
                        {profile.profilePictureUrl && (
                            <img 
                                src={profile.profilePictureUrl} 
                                alt="Profile" 
                                className="mt-4 w-32 h-32 rounded-full mx-auto" 
                            />
                        )}
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Actions</h3>
                    <div className="bg-white shadow rounded-md p-6">
                        {localStorage.getItem('username') === profile.username && (
                            <p>
                                <a
                                    href="/profile/edit"
                                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                >
                                    Edit Profile
                                </a>
                                <span className="ml-2 text-gray-500">(Coming soon)</span>
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-8 text-center">
                <a href="/" className="text-indigo-600 hover:underline">Back to Home</a>
            </div>
        </div>
    );
};

export default ProfilePage;