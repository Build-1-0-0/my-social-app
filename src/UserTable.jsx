import React from 'react';
import { Link } from 'react-router-dom'; // Import Link

function UserTable({ data }) { // Receive 'data' as a prop
    console.log("UserTable data prop:", data); // <--- ADDED: Debug log to inspect 'data'

    if (!data || !Array.isArray(data) || data.length === 0) { // <--- Enhanced null/empty check
        return <p>No user data available.</p>; // Or a more informative message like "Loading user data..." or simply return null
    }
    return (
        <div>
            {data && data.length > 0 ? ( // <---- UPDATED: Conditional rendering with ternary operator
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map(item => (
                            <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{item.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Link to={`/profile/${item.username}`} className="text-blue-500 hover:underline">
                                        {item.username}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">{item.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button className="bg-blue-200 hover:bg-blue-300 text-blue-800 font-bold py-1 px-2 rounded mr-2">Edit</button>
                                    <button className="bg-red-200 hover:bg-red-300 text-red-800 font-bold py-1 px-2 rounded">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                {data && data.length > 0 ? (
    <table className="min-w-full divide-y divide-gray-200">
        {/* ... table content ... */}
    </table>
) : (
    <p>No user data available.</p>
)}
        </div>
    );
}

export default UserTable;
