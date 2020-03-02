const express = require('express');
const Recipe = require('../db/models/recipe');
const router = express.Router();

router.get('/recipes', async (req, res) => {
    if (req.query.name) {
        try {
            const recipes = await Recipe.find({ title: new RegExp(req.query.name, 'i') }).limit(256);
            res.send(recipes);
        } catch (e) {
            console.log(e.message);
        }
    } else {
        try {
            const recipes = await Recipe.find().limit(256);
            res.send(recipes);
        } catch (e) {
            console.log(e.message);
        }
    }
});

module.exports = router;
