import React, { useState } from 'react';

const PostList = ({ posts, comments, fetchComments, createComment, createPost }) => {
    const [newPost, setNewPost] = useState('');
    const [newComment, setNewComment] = useState({});
    const [selectedPostId, setSelectedPostId] = useState(null);
    const [error, setError] = useState(null);

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

    return (
        <div className="max-w-2xl mx-auto my-6">
            <h2 className="text-2xl font-bold mb-4">Post Feed</h2>

            {/* Post Creation Form */}
            <form onSubmit={handlePostSubmit} className="mb-8">
                <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="What's on your mind?"
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
                                    <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Posted by <span className="font-medium">{post.username}</span> on{' '}
                                        {new Date(post.created_at).toLocaleString()}
                                    </p>
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
                                            {comments.map(comment => (
                                                <li key={comment.id} className="text-sm text-gray-700">
                                                    <span className="font-medium">{comment.username}:</span>{' '}
                                                    {comment.content}
                                                    <span className="text-gray-500 ml-2">
                                                        ({new Date(comment.timestamp).toLocaleString()})
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