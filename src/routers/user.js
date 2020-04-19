const express = require('express');
const User = require('../db/models/user');
const Recipe = require('../db/models/recipe');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const sharp = require('sharp');
const { sendWelcomeEmail, sendCancellationEmail } = require('../emails/account');
const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
            return cb(new Error('Please upload an image'));
        }
        cb(undefined, true);
    }
});
router.post('/users', async (req, res) => {
    const user = new User(req.body);

    try {
        await user.save();

        // sendWelcomeEmail(user.email, user.name);
        const token = await user.generateAuthToken();
        res.status(200).send({ user, token });
    } catch (e) {
        res.status(400).send(e);
    }
});

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
});

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = [ 'name', 'email', 'password', 'age' ];
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update);
    });
    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }
    try {
        updates.forEach((update) => {
            req.user[update] = req.body[update];
        });
        await req.user.save();

        res.send(req.user);
    } catch (e) {
        res.status(400).send(e);
    }
});

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove();
        sendCancellationEmail(req.user.email, req.user.name);
        res.send(req.user);
    } catch (e) {}
});

router.post(
    '/users/me/avatar',
    auth,
    upload.single('avatar'),
    async (req, res) => {
        const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
        req.user.avatar = buffer;

        await req.user.save();
        res.send();
    },
    (error, req, res, next) => {
        res.status(400).send({ error: error.message });
    }
);

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
});

router.get('/users/recipes', auth, async (req, res) => {
    let recipes = [];
    for (let i = 0; i < req.user.recipes.length; i++) {
        try {
            id = req.user.recipes[i];
            console.log(id);

            recipe = await Recipe.findById(id);
        } catch (e) {
            console.log(e);
        }

        recipes.push(recipe);
    }

    if (recipes.length > 0) {
        res.send(recipes);
    } else {
        res.status(404).send({ error: 'No own recipes' });
    }
});

router.post('/users/recipes', auth, async (req, res) => {
    const recipe = new Recipe(req.body);
    try {
        await recipe.save();
        req.user.recipes.push(recipe._id);
        await req.user.save();
        res.send();
    } catch (e) {
        res.send({ error: e });
    }
});

router.post('/users/favorites/', auth, async (req, res) => {
    if (req.body.recipeID) {
        req.user.favorites.push(req.body.recipeID);
        await req.user.save();
        res.send();
    }
});

router.get('/users/favorites', auth, async (req, res) => {
    let favorites = [];
    for (let i = 0; i < req.user.favorites.length; i++) {
        try {
            id = req.user.favorites[i];
            console.log(id);

            recipe = await Recipe.findById(id);
        } catch (e) {
            console.log(e);
        }

        favorites.push(recipe);
    }

    if (favorites.length > 0) {
        res.send(favorites);
    } else {
        res.status(404).send({ error: 'No favorite recipes' });
    }
});

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || !user.avatar) {
            throw new Error();
        }
        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    } catch (e) {}
});

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({ user, token });
    } catch (e) {
        res.status(400).send(e);
    }
});

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        });
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send(e);
    }
});

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send(e);
    }
});

module.exports = router;
