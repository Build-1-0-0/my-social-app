import React, { useState } from 'react';

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

    // ... [handleCommentSubmit, toggleComments unchanged] ...

    return (
        <div className="max-w-2xl mx-auto my-6">
            <h2 className="text-2xl font-bold mb-4">Post Feed</h2>

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

                            {/* ... [comments section unchanged] ... */}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PostList;