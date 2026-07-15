import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import corsOptions from './config/cors.js';
import userRoutes from './routes/user-routes.js';
import errorHandler from './middlewares/error-handler.js';
import notFound from './middlewares/not-found.js';

let authHandlerRef = null;

export function setAuthHandler(handler) {
  authHandlerRef = handler;
}

const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    errors: [],
  },
});

app.use('/api', limiter);

app.use('/api/auth', (req, res, next) => {
  if (authHandlerRef) {
    return authHandlerRef(req, res, next);
  }
  next();
});

app.use('/api/v1/users', userRoutes);

app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, message: 'Server is running', data: null });
});

app.use(notFound);
app.use(errorHandler);

export default app;
