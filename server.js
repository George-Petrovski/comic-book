require('dotenv').config();
var HTTP_PORT = process.env.PORT || 8080;
var express = require("express");
var exphbs = require("express-handlebars");
var fetch = require("node-fetch");
const mongoose = require("mongoose");
const path = require('path');
globalThis.fetch = fetch
var app = express();
var lastNum;
var comicViewTimes;
var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

mongoose.connect("mongodb+srv://georgep:" + process.env.DB_PASS + "@cluster0.w0iql.mongodb.net/stratus360?retryWrites=true&w=majority", {useNewUrlParser: true});

var Schema = mongoose.Schema;
var comicSchema = new Schema({
    "comicNum": Number,
    "count": Number
});
var Comic = mongoose.model("comicdata", comicSchema);

fetch("https://xkcd.com/info.0.json")
    .then(res => res.json())
    .then((out) => {
        lastNum = out.num
        var home = new Comic({
            comicNum: out.num,
            count: 1
        });
        
        Comic.findOne({ comicNum: lastNum })
            .exec()
            .then((comic) => {
                if (!comic) {
                    console.log("No comic found");
                    home.save((err) => {
                        if (err){
                            console.log("home page comic wasn't saved");
                        }else {
                            console.log("home page comic was saved");
                            Comic.findOne({ comicNum: lastNum })
                            .exec()
                            .then((comic) => {
                                if (!comic) {
                                    console.log("No comic found");
                                }else {
                                    //console.log(comic);
                                }
                            })
                            .catch((err) => {
                                console.log("There was an error: " + err);
                            });
                        }
                    });
                }else {
                    comicViewTimes = comic.count + 1;
                    Comic.updateOne(
                        { comicNum: randomNum},
                        { $set: {count: comicViewTimes}}
                    ).exec();
                    //console.log(comic);
                }
            })
            .catch((err) => {
                console.log("There was an error: " + err);
            });
    })
    .catch(err => { throw err });

var randomNum = lastNum;

app.use(express.static(path.join(__dirname, '/public')));

app.engine('.hbs', exphbs({
    extname: '.hbs',
    defaultLayout: 'main',
    helpers: {
        add: function(a, b) {
            return a + b;
        }
    }
}));
app.set('view engine', '.hbs');

app.get("/", (req, res) => {
    randomNum = lastNum;
    res.redirect("/" + randomNum);
});

app.get("/random", (req, res) => {
    randomNum = Math.floor((Math.random() * lastNum) + 1);
    res.redirect("/" + randomNum);
});

app.get("/next", (req, res) => {
    randomNum++;
    res.redirect("/" + randomNum);
});

app.get("/previous", (req, res) => {
    randomNum--;
    res.redirect("/" + randomNum);
});

app.get("/:value", (req, res) => {
    let comicNum = req.params.value;
    if (comicNum <= lastNum && comicNum >= 1){
        randomNum = comicNum;
        fetch("https://xkcd.com/" + randomNum + "/info.0.json")
        .then(res => res.json())
        .then((out) => {

            var lastPage = (out.num == lastNum) ? false : true;
            var firstPage = (out.num == 1) ? false : true;

            var monthPublished = months[out.month-1];


            var randomComic = new Comic({
                comicNum: out.num,
                count: 1
            });

            Comic.findOne({ comicNum: randomNum })
            .exec()
            .then((comic) => {
                if (!comic) {
                    console.log("No comic found");
                    randomComic.save((err) => {
                        if (err){
                            console.log("random page comic wasn't saved");
                        }else {
                            console.log("random page comic was saved");
                            Comic.findOne({ comicNum: randomNum })
                            .exec()
                            .then((comic) => {
                                if (!comic) {
                                    console.log("No comic found");
                                }else {
                                    
                                    comicViewTimes = comic.count + 1;
                                    Comic.updateOne(
                                        { comicNum: randomNum},
                                        { $set: {count: comicViewTimes}}
                                    ).exec();
                                    //console.log(comic);
                                    res.render("home", {data: out, last: lastPage, first: firstPage, month: monthPublished, viewTimes: comic.count});
                                }
                            })
                            .catch((err) => {
                                console.log("There was an error: " + err);
                            });
                        }
                    });
                }else {
                    
                    comicViewTimes = comic.count + 1;
                    Comic.updateOne(
                        { comicNum: randomNum},
                        { $set: {count: comicViewTimes}}
                    ).exec();
                    //console.log(comic);
                    res.render("home", {data: out, last: lastPage, first: firstPage, month: monthPublished, viewTimes: comic.count});
                }
            })
            .catch((err) => {
                console.log("There was an error: " + err);
            });    
            })
        .catch(err => { throw err });
    }else {
        res.render("home", {unknown: "Sorry, we couldn't find the comic you are looking for."});
    }
});

app.listen(HTTP_PORT, function(err){
    if(err) console.log("Error with app.listen");
    console.log("Express http server listening on", HTTP_PORT);
});