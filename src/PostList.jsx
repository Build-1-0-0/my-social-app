import React, { useState, useEffect } from 'react';

const PostList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const apiUrl = 'https://my-worker.africancontent807.workers.dev/';

  useEffect(() => {
    const fetchPosts = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found, or invalid token. Cannot fetch posts.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${apiUrl}api/posts`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });

        if (response.ok) {
          const postsData = await response.json();
          setPosts(postsData);
        } else if (response.status === 401) { 
          alert('Session expired. Please log in again.');
          localStorage.removeItem('token');
          window.location.reload();
        } else {
          console.error('Failed to fetch posts:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false); // Ensure loading stops
      }
    };

    fetchPosts();
  }, []);

  return (
    <div>
      <h2>Post Feed</h2>
      {loading ? (
        <p>Loading posts...</p>
      ) : posts.length === 0 ? (
        <p>No posts available.</p>
      ) : (
        <ul>
          {posts.map(post => (
            <li key={post.id}>{post.content}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PostList;