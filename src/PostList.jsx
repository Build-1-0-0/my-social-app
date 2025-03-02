import React, { useState, useEffect } from 'react';

const PostList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('No token found, or invalid token. Cannot fetch posts.');
        return;
    }
    try {
        const response = await fetch(`${apiUrl}api/posts`, {
            headers: {
                'Authorization': `Bearer ${token}`, // <---  CHECK THIS LINE VERY CAREFULLY!
            }
        });
        if (response.ok) {
            const postsData = await response.json();
            setPosts(postsData);
        } else {
            console.error('Failed to fetch posts:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Error fetching posts:', error);
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
