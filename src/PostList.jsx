import React, { useState } from 'react';
import { marked } from 'marked'; // For Markdown parsing

const PostList = ({ posts, comments, fetchComments, createComment, createPost }) => {
    const [newPost, setNewPost] = useState('');
    const [newComment, setNewComment] = useState({});
    const [selectedPostId, setSelectedPostId] = useState(null);
    const [error, setError] = useState(null);

    console.log('Posts received:', posts); // Debug log

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        if (!newPost.trim()) {
            setError('Post content cannot be empty');
            return;
        }

        try {
            setError(null);
            console.log('Submitting post:', newPost);
            await createPost(newPost);
            console.log('Post created successfully');
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
            setNewComment(prev => ({ ...prev, [postId]: '' }));
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

    // Editor Tools
    const addFormatting = (type) => {
        const textarea = document.getElementById('postTextarea');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = newPost;
        let newText;

        switch (type) {
            case 'bold':
                newText = text.substring(0, start) + '**' + text.substring(start, end) + '**' + text.substring(end);
                break;
            case 'italic':
                newText = text.substring(0, start) + '*' + text.substring(start, end) + '*' + text.substring(end);
                break;
            case 'quote':
                newText = text.substring(0, start) + '> ' + text.substring(start, end) + text.substring(end);
                break;
            default:
                newText = text;
        }

        setNewPost(newText);
        textarea.focus();
    };

    return (
        <div className="max-w-2xl mx-auto my-6">
            <h2 className="text-2xl font-bold mb-4">Post Feed</h2>

            {/* Post Creation Form */}
            <form onSubmit={handlePostSubmit} className="mb-8">
                <div className="mb-2 flex space-x-2">
                    <button
                        type="button"
                        onClick={() => addFormatting('bold')}
                        className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                        title="Bold"
                    >
                        <strong>B</strong>
                    </button>
                    <button
                        type="button"
                        onClick={() => addFormatting('italic')}
                        className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                        title="Italic"
                    >
                        <em>I</em>
                    </button>
                    <button
                        type="button"
                        onClick={() => addFormatting('quote')}
                        className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                        title="Quote"
                    >
                        &gt;
                    </button>
                </div>
                <textarea
                    id="postTextarea"
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="What's on your mind? Use **bold**, *italic*, or > quote"
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

            {/* Posts Display */}
            {posts.length === 0 ? (
                <p className="text-gray-600 text-center">No posts available yet. Be the first to post!</p>
            ) : (
                <div className="space-y-6">
                    {posts.map(post => (
                        <div key={post.id} className="bg-white p-4 rounded-lg shadow">
                            <div className="flex items-start space-x-3">
                                <div className="flex-1">
                                    <p
                                        className="text-gray-900 whitespace-pre-wrap"
                                        dangerouslySetInnerHTML={{ __html: marked(post.content, { breaks: true }) }}
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                        Posted by <span className="font-medium">{post.username}</span>
                                        {post.created_at ? ` on ${new Date(post.created_at).toLocaleString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: true,
                                        })}` : ' (time not available)'}
                                    </p>
                                </div>
                            </div>

                            {/* Comments Toggle */}
                            <button
                                onClick={() => toggleComments(post.id)}
                                className="mt-3 text-indigo-600 hover:underline text-sm"
                            >
                                {selectedPostId === post.id ? 'Hide Comments' : 'Show Comments'}
                            </button>

                            {/* Comments Section */}
                            {selectedPostId === post.id && (
                                <div className="mt-4 border-t pt-4">
                                    {comments && comments.length > 0 ? (
                                        <ul className="space-y-3">
                                            {comments.map(comment => (
                                                <li key={comment.id} className="text-sm text-gray-700">
                                                    <span className="font-medium">{comment.username}:</span>{' '}
                                                    {comment.content}
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
                                                onChange={(e) => setNewComment(prev => ({
                                                    ...prev,
                                                    [post.id]: e.target.value
                                                }))}
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