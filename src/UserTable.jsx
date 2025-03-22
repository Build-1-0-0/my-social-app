import React from 'react';

const UserTable = ({ data }) => {
    // Check if data is null or undefined
    if (!data || data.length === 0) {
        return <p className="text-center text-gray-600">No user data available.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <h2 className="text-xl font-bold mb-2 text-center">User List</h2>
            <table className="min-w-full bg-white border border-gray-200">
                <thead>
                    <tr className="bg-gray-100 border-b">
                        <th className="py-2 px-4 border">Username</th>
                        <th className="py-2 px-4 border">Email</th>
                        <th className="py-2 px-4 border">Role</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((user, index) => (
                        <tr key={index} className="border-b">
                            <td className="py-2 px-4 border">{user.username}</td>
                            <td className="py-2 px-4 border">{user.email}</td>
                            <td className="py-2 px-4 border">{user.role || 'User'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserTable;