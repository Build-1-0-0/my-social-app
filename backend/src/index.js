import { Router } from 'itty-router';
import { handleCors } from './utils/cors';
import { login, register } from './routes/auth';
import { createPost, getPosts, likePost, updatePost, deletePost } from './routes/posts';
import { createComment, getComments, likeComment } from './routes/comments';
import { getProfile, updateProfile } from './routes/profile';
import { getMedia, uploadMedia } from './routes/media';
import { getData } from './routes/data';

const router = Router();

// CORS preflight
router.options('*', handleCors);

// Auth routes
router.post('/api/users/register', register);
router.post('/api/users/login', login);

// Post routes
router.get('/api/posts', getPosts);
router.post('/api/posts', createPost);
router.post('/api/posts/:id/like', likePost);
router.put('/api/posts/:id', updatePost);
router.delete('/api/posts/:id', deletePost);

// Comment routes
router.get('/api/comments', getComments);
router.post('/api/comments', createComment);
router.post('/api/comments/:id/like', likeComment);

// Profile routes
router.get('/api/profile/:username', getProfile);
router.put('/api/profile/:username', updateProfile);

// Media routes
router.get('/api/media/:username', getMedia);
router.post('/api/media', uploadMedia);

// Data route
router.get('/api/data', getData);

export default {
  fetch: async (request, env, ctx) => {
    try {
      // Apply CORS headers to all responses
      return await router.handle(request, env, ctx).then(handleCors);
    } catch (err) {
      console.error('Router error:', err);
      return new Response(JSON.stringify({ error: err.message || 'Server error' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...handleCors().headers,
        },
      });
    }
  },
};