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

const imageURL = 'http://jaclynsimagescraper.herokuapp.com/'
const website = 'https://www.foodnetwork.com/search/'

async function performSearch(searchURL) {
    // scrape and process
    try{
        const response = await axios(searchURL);
        const html = response.data;
        const $ = cheerio.load(html);

        // get titles and urls for search results
        let searchResults = $('.o-RecipeResult', html);
        return await buildRecipeList(10, searchResults, $)

        // console.log('performSearch:');
        // console.log(recipes);


    } catch (err) {
        console.log(err);
    }
}

async function buildRecipeList(number, searchResults, $) {
    let recipes = [];
    for (let i = 0; i < number; i++) {
        const title = $(searchResults[i]).find('.m-MediaBlock__a-HeadlineText').text().trim();
        let url = $(searchResults[i]).find('a').attr('href');
        let selector = title.replace(/ /g, '');
        selector = selector.replace(/,/g, '');
        selector = selector.replace(/'/g, '');
        selector = selector.replace(/[0-9]/g, '');

        console.log(i + ' : ' + title + ' : ' + url);

        if (url) {
            url = 'https:' + url;
            let recipe = await getRecipe(url, title, selector)

            // console.log(recipe);
            recipes.push(recipe);
        }
    }
    return recipes;
}

async function getRecipe(url, title, selector) {

    // get data for recipe
    try {
        const response = await axios(url);
        const html = response.data;
        const $ = cheerio.load(html);
        const ingredients = $('.o-Ingredients__a-Ingredient', html);
        const directions = $('.o-Method__m-Step', html);
        let ingredientList = [];
        let directionList = []

        for (let i = 1; i < ingredients.length; i++) {
            ingredientList.push($(ingredients[i]).text().trim());
        }

        for (let j = 0; j < directions.length; j++) {
            directionList.push($(directions[j]).text().trim());
        }

        return {
            title,
            url,
            selector,
            ingredientList,
            directionList
        }
    } catch (err) {
        console.log(err);
    }
}

// Home Page
app.get('/', function(req,res){
    res.render('home.ejs', {recipeTitles: null, searchHistory: null});
})

app.post('/', function(req,res){
    let context = {};
    context.searchHistory = [];

    // placeholder for MVP and testing
    let ing1 = req.body.ingredient1;
    let ing2 = req.body.ingredient2;
    let ing3 = req.body.ingredient3;

    let searchURL = website;

    // search history builder
    let sH = req.body.searchHistoryInput;

    searchHistory = sH.split(';');
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
        'ing1'  :   ing1,
        'ing2'  :   ing2,
        'ing3'  :   ing3,
        'combinedSearch'    :   ing1 + '-' + ing2 + '-' + ing3
    });

    // set up scrape search
    searchURL = searchURL.concat(ing1, '-', ing2, '-');
    if (ing3) {
        searchURL = searchURL.concat(ing3, '-');
    }

    searchURL = searchURL.concat('recipe-');

    performSearch(searchURL)
        .then( recipes => {
            context.recipeTitles = recipes;
            // console.log('JUST BEFORE RENDER!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
            // console.log('context: ');
            // console.log(context);
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