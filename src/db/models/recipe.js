const mongoose = require('mongoose');
const recipeSchema = new mongoose.Schema({
    id: String,
    title: String,
    readyInMinutes: String,
    image: String,
    summary: String,
    cuisines: Array,
    diets: Array,
    instructions: String,
    analyzedInstructions: Array,
    restrictions: {
        vegetarian: Boolean,
        vegan: Boolean,
        glutenFree: Boolean,
        veryHealthy: Boolean
    },
    servings: String,
    cheap: Boolean,
    pricePerServing: String,
    extendedIngredients: Array,
    nutrients: {
        calories: String,
        carbs: String,
        fat: String,
        protein: String,
        bad: Array
    }
});
const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = Recipe;
