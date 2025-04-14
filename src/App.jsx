import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const PostList = ({
  posts,
  setPosts,
  comments,
  setComments,
  fetchComments,
  createComment,
  createPost,
  currentUsername,
  token,
  apiUrl,
}) => {
  const [newPost, setNewPost] = useState('');
  const [newComment, setNewComment] = useState({});
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [error, setError] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editMediaId, setEditMediaId] = useState('');
  const [file, setFile] = useState(null);
  const [mediaMessage, setMediaMessage] = useState('');

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) {
      setError('Post content cannot be empty');
      return;
    }
    try {
      setError(null);
      let mediaId = null;
      if (file) {
        mediaId = await handleUpload(file);
        if (!mediaId) return;
      }
      await createPost(newPost, mediaId);
      setNewPost('');
      setFile(null);
      setMediaMessage('');
      if (document.getElementById('fileInput')) {
        document.getElementById('fileInput').value = '';
      }
    } catch (err) {
      setError('Failed to create post: ' + (err.message || 'Unknown error'));
      console.error('Post creation error:', err);
    }
  };

  const handleUpload = async (file) => {
    if (!token) {
      setError('Please login to upload.');
      return null;
    }
    if (!file) {
      setError('Select a file.');
      return null;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError('File exceeds 100MB.');
      return null;
    }
    setError(null);
    setMediaMessage('Uploading...');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch(`${apiUrl}api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (data.error) {
        setError(data.error);
        setMediaMessage('');
        return null;
      }
      setMediaMessage(`Uploaded! Media ID: ${data.media_id}`);
      return data.media_id;
    } catch (err) {
      setError('Upload failed: ' + err.message);
      setMediaMessage('');
      return null;
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
      setComments({});
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
    setTimeout(() => {
      const newPos = type === 'link' ? start + 1 : end + (type === 'quote' ? 2 : 2);
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleLikePost = async (postId) => {
    try {
      const response = await fetch(`${apiUrl}api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to like post: ${response.status} - ${errorText}`);
      }
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, likes: (post.likes || 0) + 1 } : post
        )
      );
    } catch (err) {
      setError('Failed to like post: ' + (err.message || 'Unknown error'));
      console.error('Like post error:', err);
    }
  };

  const handleEditPost = async (postId) => {
    if (editingPostId === postId) {
      if (!editContent.trim()) {
        setError('Post content cannot be empty');
        return;
      }
      try {
        let mediaId = editMediaId;
        if (file) {
          mediaId = await handleUpload(file);
          if (!mediaId) return;
        }
        const response = await fetch(`${apiUrl}api/posts/${postId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: editContent, mediaId: mediaId || undefined }),
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to edit post: ${response.status} - ${errorText}`);
        }
        const updatedPost = await response.json();
        setPosts((prev) =>
          prev.map((post) => (post.id === postId ? updatedPost : post))
        );
        setEditingPostId(null);
        setEditContent('');
        setEditMediaId('');
        setFile(null);
        setMediaMessage('');
        if (document.getElementById('editFileInput')) {
          document.getElementById('editFileInput').value = '';
        }
      } catch (err) {
        setError('Failed to edit post: ' + (err.message || 'Unknown error'));
        console.error('Edit post error:', err);
      }
    } else {
      const post = posts.find((p) => p.id === postId);
      setEditingPostId(postId);
      setEditContent(post.content);
      setEditMediaId(post.media_id || '');
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const response = await fetch(`${apiUrl}api/posts/${postId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to delete post: ${response.status} - ${errorText}`);
        }
        setPosts((prev) => prev.filter((post) => post.id !== postId));
        if (selectedPostId === postId) setSelectedPostId(null);
      } catch (err) {
        setError('Failed to delete post: ' + (err.message || 'Unknown error'));
        console.error('Delete post error:', err);
      }
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const response = await fetch(`${apiUrl}api/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to like comment: ${response.status} - ${errorText}`);
      }
      await fetchComments(selectedPostId);
    } catch (err) {
      setError('Failed to like comment: ' + (err.message || 'Unknown error'));
      console.error('Like comment error:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-6">
      <h2 className="text-2xl font-bold mb-4">Post Feed</h2>

      {token && (
        <form onSubmit={handlePostSubmit} className="mb-8">
          <div className="mb-2 flex items-center space-x-2 flex-wrap">
            <button type="button" onClick={() => addFormatting('bold')} className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 font-bold" title="Bold (Ctrl+B)">B</button>
            <button type="button" onClick={() => addFormatting('italic')} className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 italic" title="Italic (Ctrl+I)">I</button>
            <button type="button" onClick={() => addFormatting('quote')} className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200" title="Quote">Quote</button>
            <button type="button" onClick={() => addFormatting('code')} className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 font-mono" title="Inline Code">{`</>`}</button>
            <button type="button" onClick={() => addFormatting('link')} className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200" title="Insert Link">🔗</button>
            <button type="button" onClick={() => addFormatting('underline')} className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 underline" title="Underline">U</button>
          </div>
          <textarea
            id="postTextarea"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="What's on your mind? Use Markdown: **bold**, *italic*, > quote, `code`, [link](url), <u>underline</u>"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y min-h-[100px]"
            maxLength={1120}
          />
          <input
            id="fileInput"
            type="file"
            accept="image/*,video/*"
            onChange={(e) => setFile(e.target.files[0])}
            className="mt-2"
          />
          {mediaMessage && <p className="text-green-600 mt-2">{mediaMessage}</p>}
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
      )}

      {posts.length === 0 ? (
        <p className="text-gray-600 text-center">No posts available yet. Be the first to post!</p>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-start space-x-3">
                <div className="flex-1">
                  {editingPostId === post.id ? (
                    <div>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows="3"
                      />
                      <input
                        type="text"
                        value={editMediaId}
                        onChange={(e) => setEditMediaId(e.target.value)}
                        placeholder="Media ID (optional)"
                        className="w-full p-2 border rounded-lg mt-2"
                      />
                      <input
                        id="editFileInput"
                        type="file"
                        accept="image/*,video/*"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="mt-2"
                      />
                      {mediaMessage && <p className="text-green-600 mt-2">{mediaMessage}</p>}
                    </div>
                  ) : (
                    <>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose text-gray-900 whitespace-pre-wrap">
                        {post.content}
                      </ReactMarkdown>
                      {post.media_id && token && (
                        <Media postId={post.id} mediaId={post.media_id} token={token} apiUrl={apiUrl} />
                      )}
                    </>
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
                    {token && (
                      <>
                        <button onClick={() => handleLikePost(post.id)} className="text-indigo-600 hover:underline text-sm">
                          Like ({post.likes || 0})
                        </button>
                        <button onClick={() => toggleComments(post.id)} className="text-indigo-600 hover:underline text-sm">
                          {selectedPostId === post.id ? 'Hide Comments' : 'Show Comments'}
                        </button>
                      </>
                    )}
                    {post.username === currentUsername && token && (
                      <>
                        <button onClick={() => handleEditPost(post.id)} className="text-indigo-600 hover:underline text-sm">
                          {editingPostId === post.id ? 'Save' : 'Edit'}
                        </button>
                        <button onClick={() => handleDeletePost(post.id)} className="text-red-600 hover:underline text-sm">
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {selectedPostId === post.id && token && (
                <div className="mt-4 border-t pt-4">
                  {(comments[selectedPostId] || []).length > 0 ? (
                    <ul className="space-y-3">
                      {(comments[selectedPostId] || []).map((comment) => (
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
                          {token && (
                            <button
                              onClick={() => handleLikeComment(comment.id)}
                              className="ml-2 text-indigo-600 hover:underline"
                            >
                              Like ({comment.likes || 0})
                            </button>
                          )}
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
                          setNewComment((prev) => ({ ...prev, [post.id]: e.target.value }))
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

function Media({ postId, mediaId, token, apiUrl }) {
  const [mediaUrl, setMediaUrl] = useState('');
  const [mimeType, setMimeType] = useState('');

  React.useEffect(() => {
    const fetchMedia = async () => {
      try {
        const response = await fetch(`${apiUrl}api/media/${mediaId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (!data.error) {
          setMediaUrl(data.url);
          setMimeType(data.mime_type);
        }
      } catch (err) {
        console.error('Media fetch failed:', err);
      }
    };
    fetchMedia();
  }, [mediaId, token, apiUrl]);

  if (!mediaUrl) return null;

  return mimeType.startsWith('image/') ? (
    <img src={mediaUrl} alt={`Media for post ${postId}`} className="max-w-full h-auto rounded mt-2" />
  ) : mimeType.startsWith('video/') ? (
    <video src={mediaUrl} controls className="max-w-full h-auto rounded mt-2" />
  ) : null;
}

export default PostList;
export { PostList };