const http = require('http');
const path = require('path');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const hbs  = require('express-handlebars');
const circuitBreaker = require('opossum');

app.engine('hbs', hbs({
  extname: 'hbs',
  defaultLayout: 'main',
  layoutsDir: __dirname + '/views/layouts/'
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(express.static('public')); 

app.get('/', (req, res) => {
    let queryString = req.query.term;
    let term = encodeURIComponent(queryString);
    let url = 'http://api.giphy.com/v1/gifs/search?q=' + term + '&api_key=dc6zaTOxFJmzC';

    http.get(url, (response) => {
        const breaker = new circuitBreaker(req.get,{
          timeout:3000,
          errorThresholdPercentage:50,
          resetTimeout:5000,
        });
    
        breaker.fallback(() => Promise.resolve({
          error: 'Giphy currently unavailable. Try again later'
        }));

        response.setEncoding('utf8');
        let body = '';
        response.on('data', (d) => {
             body += d;
        });
        response.on('end', () => {
            let parsed = JSON.parse(body);
            res.render('search-giphy', { gifs: parsed.data })
        });
    });

});

app.listen(port, () => {
  console.log('Giphy Search listening on port: ', port);
});