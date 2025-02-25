import React, { useEffect, useState } from 'react';

function DataFetcher() {
    const apiUrl = import.meta.env.VITE_API_URL; // Backend API URL
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch(`${apiUrl}/api/data`); // Use apiUrl here
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const result = await response.json();
                setData(result);
                setLoading(false);
            } catch (err) {
                setError(err);
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    // ... rest of the component
}

export default DataFetcher;
