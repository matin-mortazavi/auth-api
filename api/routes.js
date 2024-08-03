const server =require("./server")

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