// src/PostList.jsx
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const PostList = ({ posts, setPosts, comments, setComments, fetchComments, createComment, createPost, currentUsername, token }) => {
  const [newPost, setNewPost] = useState('');
  const [newComment, setNewComment] = useState({});
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [error, setError] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const workerUrl = 'https://my-worker.africancontent807.workers.dev';

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) {
      setError('Post content cannot be empty');
      return;
    }
    try {
      setError(null);
      await createPost(newPost);
      setNewPost('');
    } catch (err) {
      setError('Failed to create post: ' + (err.message || 'Unknown error'));
      console.error('Post creation error:', err);
    }
  };

  const handleCommentSubmit = async (postId, e) => {
    e.preventDefault();
    if (!newComment[postId]?.trim()) {
      setError('Comment cannot be empty');
      return;
    }
    try {
      setError(null);
      await createComment(postId, newComment[postId]);
      setNewComment((prev) => ({ ...prev, [postId]: '' }));
      await fetchComments(postId);
    } catch (err) {
      setError('Failed to add comment: ' + (err.message || 'Unknown error'));
      console.error('Comment creation error:', err);
    }
  };

  const toggleComments = async (postId) => {
    if (selectedPostId === postId) {
      setSelectedPostId(null);
    } else {
      setSelectedPostId(postId);
      try {
        await fetchComments(postId);
      } catch (err) {
        setError('Failed to load comments: ' + (err.message || 'Unknown error'));
        console.error('Comment fetch error:', err);
      }
    }
  };

  const addFormatting = (type) => {
    const textarea = document.getElementById('postTextarea');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = newPost;
    let newText;

    const insert = (prefix, suffix = '') => {
      return text.slice(0, start) + prefix + text.slice(start, end) + suffix + text.slice(end);
    };

    switch (type) {
      case 'bold':
        newText = insert('**', '**');
        break;
      case 'italic':
        newText = insert('*', '*');
        break;
      case 'quote':
        newText = insert('> ');
        break;
      case 'code':
        newText = insert('`', '`');
        break;
      case 'link':
        newText = insert('[', '](https://)');
        break;
      case 'underline':
        newText = insert('<u>', '</u>');
        break;
      default:
        newText = text;
    }
    setNewPost(newText);
    textarea.focus();
  };

  const handleLikePost = async (postId) => {
    try {
      console.log('Liking post:', postId, 'Token:', token);
      const response = await fetch(`${workerUrl}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to like post: ${response.status} - ${JSON.stringify(errorData)}`);
      }
      const data = await response.json();
      console.log('Post liked:', data);
      setPosts(posts.map((post) => (post.id === postId ? { ...post, likes: data.likes } : post)));
    } catch (err) {
      console.error('Like post error:', err);
      setError('Failed to like post: ' + (err.message || 'Unknown error'));
    }
  };

  const handleEditPost = async (postId) => {
    if (editingPostId === postId) {
      try {
        const response = await fetch(`${workerUrl}/api/posts/${postId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: editContent }),
        });
        if (!response.ok) throw new Error('Failed to edit post');
        const updatedPost = await response.json();
        console.log('Post edited:', updatedPost);
        setPosts(posts.map((post) => (post.id === postId ? updatedPost : post)));
        setEditingPostId(null);
        setEditContent('');
      } catch (err) {
        setError('Failed to edit post: ' + (err.message || 'Unknown error'));
        console.error('Edit post error:', err);
      }
    } else {
      const post = posts.find((p) => p.id === postId);
      setEditingPostId(postId);
      setEditContent(post.content);
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const response = await fetch(`${workerUrl}/api/posts/${postId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to delete post');
        console.log('Post deleted:', postId);
        setPosts(posts.filter((post) => post.id !== postId));
        if (selectedPostId === postId) setSelectedPostId(null);
      } catch (err) {
        setError('Failed to delete post: ' + (err.message || 'Unknown error'));
        console.error('Delete post error:', err);
      }
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const response = await fetch(`${workerUrl}/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to like comment: ${response.status} - ${JSON.stringify(errorData)}`);
      }
      const data = await response.json();
      console.log('Comment liked:', data);
      setComments(comments.map((comment) => (comment.id === commentId ? { ...comment, likes: data.likes } : comment)));
    } catch (err) {
      setError('Failed to like comment: ' + (err.message || 'Unknown error'));
      console.error('Like comment error:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-6">
      <h2 className="text-2xl font-bold mb-4">Post Feed</h2>

      <form onSubmit={handlePostSubmit} className="mb-8">
        <div className="mb-2 flex items-center space-x-2">
          <button
            type="button"
            onClick={() => addFormatting('bold')}
            className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 font-bold"
            title="Bold (Ctrl+B)"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => addFormatting('italic')}
            className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 italic"
            title="Italic (Ctrl+I)"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => addFormatting('quote')}
            className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 font-mono"
            <button 
title="Quote">
  Quote
</button>
          <button
            type="button"
            onClick={() => addFormatting('code')}
            className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 font-mono"
            title="Inline Code"
          >
            {'</>'}
          </button>
          <button
            type="button"
            onClick={() => addFormatting('link')}
            className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
            title="Insert Link"
          >
            🔗
          </button>
          <button
            type="button"
            onClick={() => addFormatting('underline')}
            className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 underline"
            title="Underline"
          >
            <u>U</u>
          </button>
        </div>
        <textarea
          id="postTextarea"
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="What's on your mind? Use Markdown: **bold**, *italic*, > quote, `code`, [link](url), <u>underline</u>"
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y min-h-[100px]"
          maxLength={1120}
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-gray-500">{newPost.length}/1120</span>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
            disabled={!newPost.trim()}
          >
            Post
          </button>
        </div>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </form>

      {posts.length === 0 ? (
        <p className="text-gray-600 text-center">No posts available yet. Be the first to post!</p>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-start space-x-3">
                <div className="flex-1">
                  {editingPostId === post.id ? (
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-2 border rounded-lg"
                    />
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose text-gray-900 whitespace-pre-wrap">
                      {post.content}
                    </ReactMarkdown>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    Posted by <span className="font-medium">{post.username}</span>
                    {post.created_at
                      ? ` on ${new Date(post.created_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })}`
                      : ' (time not available)'}
                  </p>
                  <div className="flex space-x-4 mt-2">
                    <button
                      onClick={() => handleLikePost(post.id)}
                      className="text-indigo-600 hover:underline text-sm"
                    >
                      Like ({post.likes || 0})
                    </button>
                    {post.username === currentUsername && (
                      <>
                        <button
                          onClick={() => handleEditPost(post.id)}
                          className="text-indigo-600 hover:underline text-sm"
                        >
                          {editingPostId === post.id ? 'Save' : 'Edit'}
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => toggleComments(post.id)}
                className="mt-3 text-indigo-600 hover:underline text-sm"
              >
                {selectedPostId === post.id ? 'Hide Comments' : 'Show Comments'}
              </button>

              {selectedPostId === post.id && (
                <div className="mt-4 border-t pt-4">
                  {comments && comments.length > 0 ? (
                    <ul className="space-y-3">
                      {comments.map((comment) => (
                        <li key={comment.id} className="text-sm text-gray-700">
                          <span className="font-medium">{comment.username}:</span>{' '}
                          <ReactMarkdown remarkPlugins={[remarkGfm]} className="inline prose">
                            {comment.content}
                          </ReactMarkdown>
                          <span className="text-gray-500 ml-2">
                            ({new Date(comment.timestamp).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })})
                          </span>
                          <button
                            onClick={() => handleLikeComment(comment.id)}
                            className="ml-2 text-indigo-600 hover:underline"
                          >
                            Like ({comment.likes || 0})
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600 text-sm">No comments yet.</p>
                  )}

                  <form onSubmit={(e) => handleCommentSubmit(post.id, e)} className="mt-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newComment[post.id] || ''}
                        onChange={(e) =>
                          setNewComment((prev) => ({
                            ...prev,
                            [post.id]: e.target.value,
                          }))
                        }
                        placeholder="Add a comment..."
                        className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                        disabled={!newComment[post.id]?.trim()}
                      >
                        Comment
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostList;