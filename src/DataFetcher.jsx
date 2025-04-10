// src/DataFetcher.jsx
import React, { useEffect, useState, useContext } from 'react';
import { MyContext } from './MyContext';

const DataFetcher = () => {
  const { authState } = useContext(MyContext); // Access token from context
  const apiUrl = import.meta.env.VITE_API_URL || 'https://my-worker.africancontent807.workers.dev/'; // Fallback
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!authState.token) {
        setError(new Error('Not authenticated'));
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${apiUrl}api/data`, {
          headers: {
            'Authorization': `Bearer ${authState.token}`, // Add token
          },
        });

        if (!response.ok) {
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
  }, [apiUrl, authState.token]); // Depend on token

  if (loading) {
    return <p>Loading data...</p>;
  }

  if (error) {
    return (
      <div>
        <p>Error fetching data: {error.message}</p>
        {import.meta.env.DEV && <pre>{JSON.stringify(error, null, 2)}</pre>}
      </div>
    );
  }

  if (!data) {
    return <p>No data available.</p>;
  }

  return (
    <div>
      {data.length > 0 ? (
        <ul>
          {data.map((item) => (
            <li key={item.id}>{item.username} - {item.email}</li>
          ))}
        </ul>
      ) : (
        <p>No data found.</p>
      )}
    </div>
  );
};

export default DataFetcher;