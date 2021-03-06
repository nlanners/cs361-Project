const express = require('express');

const app = express();
const bodyParser = require('body-parser');
const ejs = require('express-ejs-layouts');
const axios = require('axios');
const cheerio = require('cheerio');

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json({extended:false}));
app.use(express.static('public'));
app.use(ejs);

app.set('port', 65535);
app.set('view engine', 'ejs');

const imageURL = 'https://websiteimagescraper.herokuapp.com/'
const website = 'https://www.foodnetwork.com/search/'
const invalidChars = [/ /g, /[0-9]/g, /[^ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+]/g];
const resultsNumber = 10;
let duplicateNumber = 1;


/**
 * Searches `website` for with `searchURL`
 * @param searchURL : string url with which to search
 * @returns {Promise<*[]>} : results of the search; a list of JSONs
 */
async function performSearch(searchURL) {
    try{
        const response = await axios(searchURL);
        const html = response.data;
        const $ = cheerio.load(html);

        // get titles and urls for search results
        let searchResults = $('.o-RecipeResult', html);

        return await buildRecipeList(searchResults, $);

    } catch (err) {
        console.log(err);
    }
}

/**
 * Parses the search results and gets data about each recipe
 * @param searchResults : array of entries to get data for
 * @param $ : Cheerio
 * @returns {Promise<*[]>} : list of JSON data of each entry
 */
async function buildRecipeList(searchResults, $) {
    let recipes = [];
    for (let i = 0; i < resultsNumber; i++) {
        const title = $(searchResults[i]).find('.m-MediaBlock__a-HeadlineText').text().trim();
        let url = $(searchResults[i]).find('a').attr('href');

        if (url) {
            let recipe = await getRecipe('https:' + url);
            recipe.title = title;
            recipe.selector = createSelector(recipes, title);

            recipes.push(recipe);
        }
    }
    return recipes;
}

/**
 * Creates a selector name for recipe title cards in HTML
 * @param recipes : array of completed recipes
 * @param title : string of recipe title
 * @returns {*} : string of selector name
 */
function createSelector(recipes, title) {
    let selector = title;
    invalidChars.forEach(expression => {
        selector = selector.replace(expression, '');
    })

    recipes.forEach(recipe => {
        if (recipe.selector === selector) {
            selector = selector.concat(duplicateNumber);
            duplicateNumber += 1;
        }
    })
    return selector;
}

/**
 * Parses `url` html to extract data from searched recipes
 * @param url : string of search url
 * @returns {Promise<{image: *, ingredientList: *[], directionList: *[], imageTitle: (*|jQuery), url}>} : JSON of recipe info
 */
async function getRecipe(url) {

    try {
        const response = await axios(url);
        const html = response.data;
        const $ = cheerio.load(html);
        const ingredients = $('.o-Ingredients__a-Ingredient', html);
        const directions = $('.o-Method__m-Step', html);

        const imageTitle = getImageTitle($, html);

        return {
            'url' : url,
            'ingredientList' : getIngredients($, ingredients),
            'directionList' : getDirections($, directions),
            'image' : await getImage(url, imageTitle),
            'imageTitle' : imageTitle
        }
    } catch (err) {
        console.log(err);
    }
}

/**
 * Extracts the Image Title from the provided html
 * @param cheerio : cheerio
 * @param html : array of html
 * @returns {*|jQuery} : string
 */
function getImageTitle(cheerio, html) {
    let imageWrapper = cheerio('.m-MediaBlock__VideoButton', html);
    if (imageWrapper.length === 0) {
        imageWrapper = null;
    }

    let imageTitle = cheerio(imageWrapper).find('img').attr('title');
    if (!imageTitle) {
        imageTitle = cheerio(imageWrapper).find('img').attr('alt');
        if (!imageTitle) {
            imageTitle = '';
        }
    }

    return imageTitle;
}

/**
 * Extracts ingredients from provided html
 * @param cheerio : cheerio html
 * @param ingredients : array of ingredient data
 * @returns {*[]} : array of ingredients
 */
function getIngredients(cheerio, ingredients) {
    let ingredientList = [];

    for (let i = 1; i < ingredients.length; i++) {
        ingredientList.push(cheerio(ingredients[i]).text().trim());
    }

    return ingredientList;
}

/**
 * Extracts directions from provided html
 * @param cheerio : cheerio html
 * @param directions : array of direction data
 * @returns {*[]} : array of directions
 */
function getDirections(cheerio, directions) {
    let directionList = [];

    for (let j = 0; j < directions.length; j++) {
        directionList.push(cheerio(directions[j]).text().trim());
    }

    return directionList;
}

/**
 * Accesses image service to retrieve image
 * @param query : string of url to search
 * @param imageTitle : string of image title to search for
 * @returns {Promise<any>} : resulting image
 */
async function getImage(query, imageTitle){
    let image = '';

    try {
        const searchQuery = imageURL + query
        const response = await axios(searchQuery);
        const imageKeys = Object.keys(response.data);

        imageKeys.forEach(key => {
            if (key === imageTitle) {
                image = response.data[key];
            }
        })
        return image;
    } catch (err) {
        console.log(err);
    }
}

/**
 * Creates data for Search History
 * @param context : JSON for ejs context
 * @param body : JSON of request body
 */
function createSearchHistory(context, body) {
    context.searchHistory = [];
    let sH = body.searchHistoryInput;

    let searchHistory = sH.split(';');
    if (searchHistory.length >= 10) {
        searchHistory.shift();
    }

    let filteredSH = searchHistory.filter(word => word.length > 0);

    filteredSH.forEach(item => {
        let ings = item.split('-');
        context.searchHistory.push({
            'ing1'  :   ings[0],
            'ing2'  :   ings[1],
            'ing3'  :   ings[2],
            'combinedSearch'    :   item
        })
    })

    context.searchHistory.push({
        'ing1'  :   body.ingredient1,
        'ing2'  :   body.ingredient2,
        'ing3'  :   body.ingredient3,
        'combinedSearch'    :   body.ingredient1 + '-' + body.ingredient2 + '-' + body.ingredient3
    });
}

/**
 * Creates the url to use for searching.
 * @param ingredients : string of combined ingredients
 * @returns {string} : string of search URL
 */
function createSearchURL(ingredients) {
    let searchURL = website.concat(ingredients);

    if (!searchURL.endsWith('-')) {
        searchURL = searchURL.concat('-');
    }

    searchURL = searchURL.concat('recipe-');

    return searchURL;
}

/**
 * Creates the context for redering the ejs on the html page
 * @param body : JSON of request body (req.body)
 * @returns {{}} : JSON of rendering context
 */
function createContext(body) {
    let context = {};
    let ing1 = body.ingredient1;
    let ing2 = body.ingredient2;
    let ing3 = body.ingredient3;
    let combined = ing1 + '-' + ing2 + '-' + ing3;
    context.currentSearch = combined;

    createSearchHistory(context, body);

    context.searchMessage = 'Search Results For ' + combined;

    return context;
}

// Home Page
app.get('/', function(req,res){
    res.render('home.ejs',
        {
            recipeTitles: null,
            searchHistory: null,
            currentSearch: null,
            searchMessage: 'Search Results'
        });
})

// After clicking `Search`
app.post('/', function(req,res){

    let context = createContext(req.body);

    // set up scrape search
    const searchURL = createSearchURL(combined);

    performSearch(searchURL)
        .then( recipes => {
            context.recipeTitles = recipes;
            res.render('home.ejs', context);
        })
        .catch( (err) => {
            console.log(err);
        })
})

// 404 ERROR
app.use(function(req, res){
    res.status(404);
    res.send('error 404');
})

// 500 ERROR
app.use(function(req, res){
    console.error(req.stack);
    res.type('plain/text');
    res.status(500);
    res.send('error 500');
});

// APP LISTEN
app.listen(app.get('port'), function(){

    console.log('Express started on localhost:' + app.get('port') + '; press Ctrl-C to terminate.');

});