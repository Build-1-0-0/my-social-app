import React, { useEffect, useState } from 'react';

function DataFetcher() {
    const apiUrl = import.meta.env.VITE_API_URL; // Backend API URL
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null); // Clear any previous errors

            try {
                const response = await fetch(`${apiUrl}/api/data`);

                if (!response.ok) {
                    // Log the error response body for debugging
                    const errorText = await response.text();
                    console.error('API Error:', { status: response.status, body: errorText });
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                setData(result);
            } catch (err) {
                console.error('Fetch Error:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [apiUrl]);

    if (loading) {
        return <p>Loading data...</p>;
    }

    if (error) {
        return (
            <div>
                <p>Error fetching data: {error.message}</p>
                {/* Optionally display more detailed error info in development */}
                {import.meta.env.DEV && <pre>{JSON.stringify(error, null, 2)}</pre>}
            </div>
        );
    }

    if (!data) {
        return <p>No data available.</p>; // Handle the case where data is still null
    }

    return (
        <div>
            {/* Display your data here */}
            {data.length > 0 ? (
                <ul>
                    {data.map((item) => (
                        <li key={item.id}>{item.username} - {item.email}</li> // Assuming 'id', 'username', and 'email' exist. Adapt as needed
                    ))}
                </ul>
            ) : (
                <p>No data found.</p>
            )}
        </div>
    );
}

export default DataFetcher;
