const jsonServer = require('json-server');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

 const server = jsonServer.create();
const router = jsonServer.router('db.json');
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
  apis: ['api/routes'], // Path to the API docs
};

const specs = swaggerJsdoc(options);
server.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Secret key for JWT
const SECRET_KEY = '123456789';
const expiresIn = '1h';

// Create a token from a payload

// Middleware for parsing request bodies
server.use(bodyParser.urlencoded({extended: true}));
server.use(bodyParser.json());
server.use(middlewares);
function createToken(payload){
    return jwt.sign(payload, SECRET_KEY, {expiresIn});
}

// Verify the token
function verifyToken(token){
    return jwt.verify(token, SECRET_KEY, (err, decode) => decode !== undefined ? decode : err);
}

// Check if the user exists in database
function isAuthenticated({email, password}){
    const userdb = JSON.parse(fs.readFileSync('./users.json', 'UTF-8'));
    return userdb.users.findIndex(user => user.email === email && user.password === password) !== -1;
}


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
    const {email, password} = req.body;
    if (isAuthenticated({email, password}) === false) {
        const status = 401;
        const message = 'Incorrect email or password';
        res.status(status).json({status, message});
        return;
    }
    const access_token = createToken({email, password});
    res.status(200).json({access_token});
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
 *         description: Email and Password already exist
 */
server.post('/auth/register', (req, res) => {
    const {email, password} = req.body;
    const userdb = JSON.parse(fs.readFileSync('./users.json', 'UTF-8'));

    if(isAuthenticated({email, password}) === true) {
        const status = 401;
        const message = 'Email and Password already exist';
        res.status(status).json({status, message});
        return;
    }

    fs.readFile('./users.json', (err, data) => {
        if (err) {
            const status = 401;
            const message = err;
            res.status(status).json({status, message});
            return;
        };

        // Get current users data
        var data = JSON.parse(data.toString());

        // Get the id of last user
        var last_item_id = data.users[data.users.length-1].id;

        // Add new user
        data.users.push({id: last_item_id + 1, email: email, password: password}); //add some data
        var writeData = fs.writeFileSync('./users.json', JSON.stringify(data)); //overwrite users file

        // Create token for new user
        const access_token = createToken({email, password});
        res.status(200).json({access_token});
    });
});


server.use(jsonServer.rewriter({
    '/api/*': '/$1',
    '/blog/:resource/:id/show': '/:resource/:id'
}));
server.use(router);
server.listen(3000, () => {
    console.log('JSON Server is running');
});
//dasd
//dad
// Export the Server API
module.exports = server;