const express = require('express');

const app = express();
const bodyParser = require('body-parser');
const ejs = require('express-ejs-layouts');

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json({extended:false}));
app.use(express.static('public'));
app.use(ejs);

app.set('port', 65535);
app.set('view engine', 'ejs');

// Home Page
app.get('/', function(req,res){
    res.render('home.ejs', {recipeTitle: null, searchHistory: null});
})

app.post('/', function(req,res){
    let context = {};
    context.recipeTitle = [];
    context.searchHistory = [];

    // placeholder for MVP and testing
    let ing1 = req.body.ingredient1;
    let ing2 = req.body.ingredient2;
    let ing3 = req.body.ingredient3;
    let search = ing1 + '-' + ing2 + '-' + ing3;

    // placeholder for MVP and testing
    if (ing1) {
        let recipe = ing1 + '-recipe';
        context.recipeTitle.push(recipe);
        if (ing2) {
            recipe = ing1 + '-' + ing2 + '-recipe';
            context.recipeTitle.push(recipe);
            if (ing3) {
                recipe = ing1 + '-' + ing2 + '-' + ing3 + '-recipe';
                context.recipeTitle.push(recipe);
            }
        }
    } else if (ing2) {
        let recipe = ing2 + '-recipe';
        context.recipeTitle.push(recipe);
        if (ing3) {
            recipe = ing2 + '-' + ing3 + '-recipe';
            context.recipeTitle.push(recipe);
        }
    } else if (ing3) {
        let recipe = ing3 + '-recipe';
        context.recipeTitle.push(recipe);
    }

    // search history builder
    console.log(req.body.searchHistoryInput);
    let sH = req.body.searchHistoryInput;

    context.searchHistory = sH.split(';');
    context.searchHistory.push(search);
    console.log("search history");
    console.log(context.searchHistory);

    res.render('home.ejs', context);
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