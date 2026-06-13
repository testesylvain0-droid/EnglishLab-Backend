# EnglishLab - Backend

Node.js backend API for EnglishLab PWA. Handles authentication, lesson management, and user progress tracking using Firebase.

## Features

- 🔐 **Firebase Authentication** - Secure user authentication
- 📚 **Lesson Management** - CRUD operations for lessons
- 👥 **User Progress Tracking** - Track learning progress
- 📊 **Analytics** - User engagement and completion metrics
- 🚀 **RESTful API** - Clean API design
- 🔒 **Firebase Security Rules** - Secure data access

## Tech Stack

- Node.js & Express.js
- Firebase Admin SDK
- Firestore Database
- Firebase Cloud Functions
- Cors & Environment variables

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase credentials:
   - Download your Firebase service account key
   - Save it as `serviceAccountKey.json`

4. Create `.env` file:
   ```
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_PRIVATE_KEY=your_private_key
   FIREBASE_CLIENT_EMAIL=your_client_email
   PORT=5000
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Build for production:
   ```bash
   npm run build
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Lessons
- `GET /api/lessons` - Get all lessons
- `GET /api/lessons/:id` - Get lesson by ID
- `POST /api/lessons` - Create new lesson (admin)
- `PUT /api/lessons/:id` - Update lesson (admin)
- `DELETE /api/lessons/:id` - Delete lesson (admin)

### User Progress
- `GET /api/users/:uid/progress` - Get user progress
- `POST /api/users/:uid/progress` - Update user progress
- `GET /api/users/:uid/stats` - Get user statistics

### Admin
- `GET /api/admin/analytics` - Get platform analytics
- `GET /api/admin/users` - Get all users

## Project Structure

```
.
├── functions/          # Cloud Functions
├── middleware/         # Express middleware
├── routes/            # API routes
├── controllers/       # Route handlers
├── models/           # Data models
├── utils/            # Utility functions
├── config/           # Configuration files
└── server.js         # Main server file
```

## Environment Variables

```
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_DATABASE_URL=your_database_url
PORT=5000
NODE_ENV=development
```

## Firebase Firestore Collections

### users
- userId (Document ID)
- name
- email
- level (beginner, intermediate, advanced)
- lessonsCompleted
- totalPoints
- createdAt
- updatedAt

### lessons
- lessonId (Document ID)
- title
- description
- level
- content (array of steps)
- duration
- points
- type
- createdAt
- updatedAt

### progress
- progressId (Document ID)
- userId
- lessonId
- completed
- score
- completedAt

## Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /lessons/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.admin == true;
    }
    match /progress/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Deployment

Deploy to Firebase Cloud Functions:

```bash
firebase deploy --only functions
```

Or deploy to Heroku:

```bash
git push heroku main
```

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT
