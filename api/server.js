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

// Middleware for parsing request bodies
server.use(bodyParser.urlencoded({extended: true}));
server.use(bodyParser.json());
server.use(middlewares);


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