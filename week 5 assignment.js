// Single-file MERN Blog App (Simplified for Demonstration)

/** SERVER & API (Node.js + Express + Mongoose) **/
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
const app = express();
require('dotenv').config();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mern_blog', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  createdAt: { type: Date, default: Date.now },
});

const categorySchema = new mongoose.Schema({
  name: String,
});

const Post = mongoose.model('Post', postSchema);
const Category = mongoose.model('Category', categorySchema);

app.get('/api/posts', async (req, res) => {
  const posts = await Post.find().populate('category');
  res.json(posts);
});

app.get('/api/posts/:id', async (req, res) => {
  const post = await Post.findById(req.params.id).populate('category');
  res.json(post);
});

app.post('/api/posts',
  body('title').notEmpty(),
  body('content').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const post = new Post(req.body);
    await post.save();
    res.status(201).json(post);
  }
);

app.put('/api/posts/:id', async (req, res) => {
  const updated = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

app.delete('/api/posts/:id', async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

app.get('/api/categories', async (req, res) => {
  const categories = await Category.find();
  res.json(categories);
});

app.post('/api/categories', async (req, res) => {
  const category = new Category(req.body);
  await category.save();
  res.status(201).json(category);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));

/** CLIENT (React with Vite - Embedded JSX + Hooks + Routing) **/
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';

const API_URL = 'http://localhost:3000/api';

const useFetch = (endpoint) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}${endpoint}`)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      });
  }, [endpoint]);

  return { data, loading };
};

function PostList() {
  const { data: posts, loading } = useFetch('/posts');
  return loading ? <p>Loading...</p> : (
    <div>
      <h2>All Posts</h2>
      {posts.map((p) => (
        <div key={p._id}>
          <h3><Link to={`/post/${p._id}`}>{p.title}</Link></h3>
          <p>{p.content.substring(0, 100)}...</p>
        </div>
      ))}
    </div>
  );
}

function PostDetail() {
  const { id } = useParams();
  const { data: post, loading } = useFetch(`/posts/${id}`);
  return loading ? <p>Loading...</p> : (
    <div>
      <h2>{post.title}</h2>
      <p>{post.content}</p>
      <p><strong>Category:</strong> {post.category?.name}</p>
    </div>
  );
}

function PostForm() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/categories`).then(res => res.json()).then(setCategories);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch(`${API_URL}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, category }),
    });
    navigate('/');
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create Post</h2>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Content" />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">Select Category</option>
        {categories.map((c) => (
          <option key={c._id} value={c._id}>{c.name}</option>
        ))}
      </select>
      <button type="submit">Submit</button>
    </form>
  );
}

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link> | <Link to="/create">New Post</Link>
      </nav>
      <Routes>
        <Route path="/" element={<PostList />} />
        <Route path="/post/:id" element={<PostDetail />} />
        <Route path="/create" element={<PostForm />} />
      </Routes>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

/** Note: This simplified setup merges client and server logic for illustration only. In production, client and server are typically in separate folders. **/
