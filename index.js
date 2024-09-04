const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const swaggerui = require('swagger-ui-express');
const specs = require('./config/swagger');

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoints
const getFirst = require('./endpoints/getFirst');
const getLast = require('./endpoints/getLast');
const removeLast = require('./endpoints/removeLast');
const getSubString = require('./endpoints/getSubString');
const timestamp = require('./endpoints/timestamp');
const currencyFormat = require('./endpoints/currencyFormat');
const convertNum = require('./endpoints/convertNum');
const base64 = require('./endpoints/base64');

// POST requests
app.post('/getfirst', getFirst);
app.post('/getlast', getLast);
app.post('/removelast', removeLast);
app.post('/getsubstring', getSubString);
app.post('/timestamp', timestamp);
app.post('/base64', base64);

// GET requests
app.get('/convertnum', convertNum);
app.get('/currencyformat', currencyFormat);


// Use requests
app.use('/docs', swaggerui.serve, swaggerui.setup(specs));

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
