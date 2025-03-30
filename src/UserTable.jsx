import React from 'react';

const UserTable = ({ data }) => {
    if (!data || data.length === 0) {
        return <p className="text-center text-gray-600">No user data available.</p>;
    }

    return (
        <div className="overflow-x-auto mx-4 my-6">
            <h2 className="text-xl font-bold mb-4 text-center">User List</h2>
            <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="py-3 px-6 text-left text-sm font-medium text-gray-700 border-b">ID</th>
                        <th className="py-3 px-6 text-left text-sm font-medium text-gray-700 border-b">Username</th>
                        <th className="py-3 px-6 text-left text-sm font-medium text-gray-700 border-b">Email</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 border-b">
                            <td className="py-3 px-6 text-gray-900">{user.id}</td>
                            <td className="py-3 px-6 text-gray-900">{user.username}</td>
                            <td className="py-3 px-6 text-gray-900">{user.email}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserTable;