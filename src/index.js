const express = require('express');
const app = express();
const PORT = process.env.PORT;
require('./db/mongoose');
const recipeRouter = require('./routers/recipe');
const cors = require('cors');
const userRouter = require('./routers/user');

app.use(cors());

app.use(express.json());

app.use(recipeRouter);
app.use(userRouter);

app.listen(PORT, () => {
    console.log('Server running on port ', PORT);
});
