const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
require('./db/mongoose');
const recipeRouter = require('./routers/recipe');
const cors = require('cors');

app.use(cors());

app.use(express.json());

app.use(recipeRouter);

app.listen(PORT, () => {
    console.log('Server running on port ', PORT);
});
