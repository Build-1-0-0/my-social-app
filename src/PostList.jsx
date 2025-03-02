import React, { useState, useEffect } from 'react';

const PostList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const response = await fetch(https://my-worker.africancontent807.workers.dev/api/posts`); // Replace YOUR_API_URL_FOR_POSTS_HERE with your actual API base URL. Assuming apiUrl is already defined in your App.js and passed down or is globally accessible, or if you define apiUrl in PostList as well. If not, you'll need to define apiUrl in PostList or use the full URL to your worker endpoint here directly. For example: const apiUrl = 'https://your-worker-subdomain.workers.dev/'; const response = await fetch(`${apiUrl}api/posts`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        setPosts(json);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div>
      <h2>Post Feed</h2>
      {loading ? (
        <p>Loading posts...</p>
      ) : (
        <ul>
          {/* For now, just display a message */}
          <li>Posts will be displayed here... (still building this feature!)</li>
        </ul>
      )}
    </div>
  );
};

export default PostList;
