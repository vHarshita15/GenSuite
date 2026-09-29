import 'dotenv/config'
import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import aiRouter from './routes/aiRoutes.js';
import userRouter from './routes/userRoutes.js';
import linkedinOptimizationRouter from './routes/linkedinOptimizationRoutes.js';
import connectCloudinary from './configs/cloudinary.js';
import interviewRouter from './routes/interviewRoutes.js';
import opportunityRouter from './routes/opportunityRoutes.js';
import communityResourceRouter from './routes/communityResourceRoutes.js';
import { requireUser } from './middlewares/requireUser.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

app.get('/api/test', (req, res) => {
  res.json({ message: 'Server working v2!' });
});

app.use('/api/ai', aiRouter);
app.use('/api', linkedinOptimizationRouter);
app.use('/api/user', userRouter);
app.use('/api/interview', requireUser, interviewRouter);
app.use('/api/opportunities', opportunityRouter);
app.use('/api/community-resources', communityResourceRouter);

connectCloudinary().catch(err => console.warn('Cloudinary not configured or failed to initialize:', err?.message || err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
