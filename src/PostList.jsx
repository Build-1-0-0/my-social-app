import React, { useState, useEffect } from 'react';

const PostList = ({ posts, comments, fetchComments, createComment, createPost }) => {
    const [newPost, setNewPost] = useState('');
    const [newComment, setNewComment] = useState({});
    const [selectedPostId, setSelectedPostId] = useState(null);

    const handlePostSubmit = (e) => {
        e.preventDefault();
        if (newPost.trim()) {
            createPost(newPost);
            setNewPost('');
        }
    };

    const handleCommentSubmit = (postId, e) => {
        e.preventDefault();
        if (newComment[postId]?.trim()) {
            createComment(postId, newComment[postId]);
            setNewComment(prev => ({ ...prev, [postId]: '' }));
        }
    };

    return (
        <div className="max-w-2xl mx-auto my-6">
            <h2 className="text-2xl font-bold mb-4">Post Feed</h2>
            
            {/* Create Post Form */}
            <form onSubmit={handlePostSubmit} className="mb-6">
                <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                    type="submit"
                    className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                    Post
                </button>
            </form>

            {/* Posts List */}
            {posts.length === 0 ? (
                <p className="text-gray-600">No posts available.</p>
            ) : (
                <div className="space-y-6">
                    {posts.map(post => (
                        <div key={post.id} className="bg-white p-4 rounded-lg shadow">
                            <p className="text-gray-900">{post.content}</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Posted by {post.username} on {new Date(post.created_at).toLocaleString()}
                            </p>
                            
                            {/* Comments Toggle */}
                            <button
                                onClick={() => {
                                    setSelectedPostId(selectedPostId === post.id ? null : post.id);
                                    if (selectedPostId !== post.id) fetchComments(post.id);
                                }}
                                className="mt-2 text-indigo-600 hover:underline"
                            >
                                {selectedPostId === post.id ? 'Hide Comments' : 'Show Comments'}
                            </button>

                            {/* Comments Section */}
                            {selectedPostId === post.id && (
                                <div className="mt-4">
                                    {comments.length === 0 ? (
                                        <p className="text-gray-600">No comments yet.</p>
                                    ) : (
                                        <ul className="space-y-2">
                                            {comments.map(comment => (
                                                <li key={comment.id} className="text-sm text-gray-700">
                                                    <span className="font-medium">{comment.username}:</span> {comment.content}
                                                    <span className="text-gray-500 ml-2">
                                                        ({new Date(comment.timestamp).toLocaleString()})
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    
                                    {/* Comment Form */}
                                    <form onSubmit={(e) => handleCommentSubmit(post.id, e)} className="mt-3">
                                        <input
                                            type="text"
                                            value={newComment[post.id] || ''}
                                            onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                                            placeholder="Add a comment..."
                                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <button
                                            type="submit"
                                            className="mt-2 px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                        >
                                            Comment
                                        </button>
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