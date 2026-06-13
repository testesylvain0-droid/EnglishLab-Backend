require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./config/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware to verify Firebase ID token
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.userId = decodedToken.uid;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Lessons routes
app.get('/api/lessons', async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('lessons').get();
    const lessons = [];
    snapshot.forEach(doc => {
      lessons.push({ id: doc.id, ...doc.data() });
    });
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/lessons/:id', async (req, res) => {
  try {
    const doc = await admin.firestore().collection('lessons').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/lessons', verifyToken, async (req, res) => {
  try {
    const { title, description, level, content, duration, points, type } = req.body;
    
    const lessonRef = await admin.firestore().collection('lessons').add({
      title,
      description,
      level,
      content,
      duration,
      points,
      type,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.status(201).json({ id: lessonRef.id, message: 'Lesson created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/lessons/:id', verifyToken, async (req, res) => {
  try {
    await admin.firestore().collection('lessons').doc(req.params.id).update({
      ...req.body,
      updatedAt: new Date()
    });
    res.json({ message: 'Lesson updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/lessons/:id', verifyToken, async (req, res) => {
  try {
    await admin.firestore().collection('lessons').doc(req.params.id).delete();
    res.json({ message: 'Lesson deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User progress routes
app.get('/api/users/:uid/progress', verifyToken, async (req, res) => {
  try {
    const snapshot = await admin.firestore()
      .collection('progress')
      .where('userId', '==', req.params.uid)
      .get();
    
    const progress = [];
    snapshot.forEach(doc => {
      progress.push({ id: doc.id, ...doc.data() });
    });
    
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users/:uid/progress', verifyToken, async (req, res) => {
  try {
    const { lessonId, completed, score } = req.body;
    
    const progressRef = await admin.firestore().collection('progress').add({
      userId: req.params.uid,
      lessonId,
      completed,
      score,
      completedAt: new Date()
    });

    // Update user stats
    const userRef = admin.firestore().collection('users').doc(req.params.uid);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      await userRef.update({
        lessonsCompleted: (userDoc.data().lessonsCompleted || 0) + (completed ? 1 : 0),
        totalPoints: (userDoc.data().totalPoints || 0) + (score || 0),
        updatedAt: new Date()
      });
    }

    res.status(201).json({ id: progressRef.id, message: 'Progress recorded' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:uid/stats', verifyToken, async (req, res) => {
  try {
    const userDoc = await admin.firestore().collection('users').doc(req.params.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(userDoc.data());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics routes
app.get('/api/admin/analytics', verifyToken, async (req, res) => {
  try {
    const usersSnapshot = await admin.firestore().collection('users').get();
    const lessonsSnapshot = await admin.firestore().collection('lessons').get();
    const progressSnapshot = await admin.firestore().collection('progress').get();

    res.json({
      totalUsers: usersSnapshot.size,
      totalLessons: lessonsSnapshot.size,
      totalProgress: progressSnapshot.size,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 EnglishLab Backend running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
});

module.exports = app;
