const express = require('express');
const Recipe = require('../db/models/recipe');
const router = express.Router();

router.get('/recipes/:id', async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        res.send(recipe);
    } catch (e) {
        res.send();
    }
});

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
            const recipes = await Recipe.find().limit(48);

            res.send(recipes);
        } catch (e) {
            console.log(e);
        }
    }
});

module.exports = router;
