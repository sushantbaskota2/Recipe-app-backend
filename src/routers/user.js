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
        console.log(file);

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
        console.log(buffer);

        await req.user.save();
        res.send(buffer);
    },
    (error, req, res, next) => {
        console.log(error);
        res.status(400).send({ error: error.message });
    }
);

router.get('/users/me/avatar', auth, async (req, res) => {
    console.log('aayo hai');

    try {
        const avatar = req.user.avatar;
        if (avatar) {
            res.send({ avatar });
        } else {
            throw new Error('');
        }
    } catch (e) {
        res.send({ error: 'No avatar' });
    }
});

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

router.patch('/users/recipes', auth, async (req, res) => {
    const update = req.body;
    if (!req.user.recipes.includes(req.body._id)) {
        res.status(401).send({ error: ' Not authorized' });
    }
    try {
        await Recipe.updateOne({ _id: req.body._id }, req.body);
    } catch (e) {
        res.send(e);
    }
});

router.delete('/users/recipes', auth, async (req, res) => {
    if (req.body.recipeID) {
        req.user.recipes.filter((rec) => rec !== req.body.recipeID);
        await Recipe.deleteOne({ _id: req.body.recipeID });
        await req.user.save();
        res.send();
    }
});

router.post('/users/favorites/', auth, async (req, res) => {
    if (req.body.recipeID) {
        if (req.user.favorites.includes(req.body.recipeID)) {
            res.send();
        }
        req.user.favorites.push(req.body.recipeID);

        await req.user.save();
        res.send();
    } else {
        res.send({ error: ' no ID received' });
    }
});

router.delete('/users/favorites/:id', auth, async (req, res) => {
    if (req.params.id) {
        try {
            req.user.favorites = req.user.favorites.filter((rec) => {
                console.log(rec.toString() === req.params.id.toString());
                return rec.toString() !== req.params.id.toString();
            });
            await req.user.save();
            console.log(req.user.favorites);
            res.send();
        } catch (e) {
            res.status(404).send({ error: 'Not Found' });
        }
    }
});

router.get('/users/favorites/', auth, async (req, res) => {
    let favorites = [];
    for (let i = 0; i < req.user.favorites.length; i++) {
        try {
            id = req.user.favorites[i];

            recipe = await Recipe.findById(id);
        } catch (e) {
            console.log(e);
        }

        favorites.push(recipe);
    }

    if (favorites.length > 0) {
        res.send(favorites);
    } else {
        res.send([]);
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
