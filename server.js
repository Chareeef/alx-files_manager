import express from 'express';
import router from './routes/index';

// Create Express app
const app = express()

// Use router
app.use(express.json());
app.use('/', router);

// Start listening
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
