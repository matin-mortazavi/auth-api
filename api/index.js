import jsonServer from 'json-server';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Setup lowdb with FileSync adapter
const file = join(__dirname, '../db.json');
const adapter = new FileSync(file);
const db = low(adapter);
db.defaults({ users: [] }).write();

const server = jsonServer.create();
const router = jsonServer.router(db);
const middlewares = jsonServer.defaults();

// Swagger setup
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'JSON Server API with Authentication',
      version: '1.0.0',
    },
  },
  apis: [join(__dirname, 'index.js')], // Path to the API docs
};

const specs = swaggerJsdoc(options);
server.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Secret key for JWT
const SECRET_KEY = '123456789';
const expiresIn = '1h';

// Create a token from a payload
function createToken(payload) {
  return jwt.sign(payload, SECRET_KEY, { expiresIn });
}

// Verify the token
function verifyToken(token) {
  return jwt.verify(token, SECRET_KEY, (err, decode) => (decode !== undefined ? decode : err));
}

// Check if the user exists in database
function isAuthenticated({ email, password }) {
  return db.get('users').find({ email, password }).value() !== undefined;
}

// Middleware for parsing request bodies
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());
server.use(middlewares);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful login
 *       401:
 *         description: Incorrect email or password
 */
server.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  if (!isAuthenticated({ email, password })) {
    return res.status(401).json({ message: 'Incorrect email or password' });
  }
  const access_token = createToken({ email });
  res.status(200).json({ access_token });
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: User registration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful registration
 *       401:
 *         description: Email already exists
 */
server.post('/auth/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  if (db.get('users').find({ email }).value()) {
    return res.status(401).json({ message: 'Email already exists' });
  }

  // Add new user
  const newUser = { id: db.get('users').size().value() + 1, email, password };
  db.get('users').push(newUser).write();

  // Create token for new user
  const access_token = createToken({ email });
  res.status(200).json({ access_token });
});

server.use(jsonServer.rewriter({
  '/api/*': '/$1',
  '/blog/:resource/:id/show': '/:resource/:id'
}));
server.use(router);
server.listen(3000, () => {
  console.log('JSON Server is running');
});

// Export the Server API
export default server;