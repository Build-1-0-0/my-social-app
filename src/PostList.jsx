import React from 'react';
import { Link } from 'react-router-dom'; // Import Link

function PostList({ posts, comments, fetchComments, createComment }) {
    return (
        <div>
            {posts.length > 0 && (
                <div className="mb-4">
                    <h2 className="text-xl font-semibold mb-2">Posts</h2>
                    {posts.map(post => (
                        <div key={post.id} className="mb-4 p-4 border rounded">
                            <p className="font-semibold">
                                <Link to={`/profile/${post.username}`} className="text-blue-500 hover:underline">
                                    {post.username}
                                </Link>
                            </p>
                            <p>{post.content}</p>

                            <div className="mt-2">
                                <input
                                    type="text"
                                    id={`comment-input-${post.id}`}
                                    placeholder="Add a comment..."
                                    className="border p-1 w-full mb-2"
                                />
                                <button onClick={() => createComment(post.id, document.getElementById(`comment-input-${post.id}`).value)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded">Comment</button>
                            </div>
                            <div id={`comments-${post.id}`}>
                                {comments[post.id] && comments[post.id].map(comment => (
                                    <div key={comment.id} className="p-2 border-t">
                                        <p><span className="font-semibold">{comment.username}:</span> {comment.content}</p>
                                    </div>
                                ))}
                                <button onClick={() => fetchComments(post.id)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-1 px-2 rounded mt-1">Load Comments</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default PostList;
