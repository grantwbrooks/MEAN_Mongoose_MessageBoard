// Require the Express Module
var express = require('express');
// Create an Express App
var app = express();
// Require Mongoose
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/message_board');

// define Schema variable
var Schema = mongoose.Schema;

// define Post Schema
var PostSchema = new mongoose.Schema({
    text: {type: String, required: true }, 
    name: {type: String, required: true, minlength: 4}, 
    comments: [{type: Schema.Types.ObjectId, ref: 'Comment'}]
}, {timestamps: true });
// define Comment Schema
var CommentSchema = new mongoose.Schema({
    _post: {type: Schema.Types.ObjectId, ref: 'Post'},
    text: {type: String, required: true },
    name: {type: String, required: true, minlength: 4}
}, {timestamps: true });
// set our models by passing them their respective Schemas
mongoose.model('Post', PostSchema);
mongoose.model('Comment', CommentSchema);
// store our models in variables
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');


mongoose.Promise = global.Promise;

// Require body-parser (to receive post data from clients)
var bodyParser = require('body-parser');
// Integrate body-parser with our App
app.use(bodyParser.urlencoded({ extended: true }));
// Require path
var path = require('path');
// Setting our Static Folder Directory
app.use(express.static(path.join(__dirname, './static')));
// Setting our Views Folder Directory
app.set('views', path.join(__dirname, './views'));
// Setting our View Engine set to EJS
app.set('view engine', 'ejs');

// Routes/////////////

// GET Root Request  show all fish
// app.get('/', function(req, res) {
//     Post.find({}, function(err, posts) {
//         if(err) {
//             console.log("didn't get quote data");
//             res.render('index');
//         } else {
//             console.log("got post data");
//             console.log(posts)
//             res.render('index', {postData: posts});
//         }
//     })
// })

var myerrors = [];

app.get('/', function(req, res) {
    Post.find({})
    .populate('comments')
    .exec(function(err, posts) {
        console.log("posts ---->",posts)
        res.render('index', {postData: posts, errors: myerrors});
    });
});

// route for getting a particular post and comments
app.get('/posts/:id', function (req, res){
    Post.findOne({_id: req.params.id})
    .populate('comments')
    .exec(function(err, post) {
         res.render('post', {post: post});
    });
});


// POST for a new post ;)
app.post('/posts', function(req, res) {
    console.log("POST DATA-- req body>", req.body);
    // Try to save that new user to the database (this is the method that actually inserts into the db) and run a callback function with an error (if any) from the operation.
    Post.create(req.body, function(err, post) {
        // if there is an error console.log that something went wrong!
        if(err) {
            console.log('something went wrong saving user');
            console.log(err.errors);
            myerrors = err.errors
            // res.render('index', {errors: post.errors});
            // res.render('index',{errors: err.errors});
            res.redirect('/');
        } else { // else console.log that we did well and then redirect to the root route
            console.log('successfully added a post!');
            myerrors = [];
            res.redirect('/');
        }
    })
})

// route for creating one comment with the parent post id
app.post('/comments/:id', function (req, res){
    Post.findOne({_id: req.params.id}, function(err, post){
        var comment = new Comment(req.body);
        comment._post = post._id;
        post.comments.push(comment);
        comment.save(function(err){
            if(err) {
                console.log('Error********------>', err.errors);
                myerrors = err.errors
                // res.render('index',{errors: err.errors});
                res.redirect('/');
            }
            else {
                post.save(function(err){
                        if(err) { 
                            console.log('Error********------>', err.errors);
                            myerrors = err.errors
                            // res.render('index',{errors: err.errors});
                            res.redirect('/');
                        } 
                        else { 
                            myerrors = [];
                            console.log('saved a new comment')
                            res.redirect('/'); }
                });
            }
        });
    });
});



// Setting our Server to Listen on Port: 8000
app.listen(8000, function() {
    console.log("listening on port 8000 for message/comment creation");
})
