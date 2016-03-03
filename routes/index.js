var express = require('express');
var passport = require('passport');
var Account = require('../models/account');
var Image = require('../models/image-model.js');
var Comment = require('../models/comment.js');
var router = express.Router();

//receives the index view along with request.user, the jade file will then decide which version of the home page to display depending
//on if the user is currently authenticated.
router.get('/', function (req, res) {
  res.render('index', { user : req.user });
});

//about us page
router.get('/about', function (req, res) {
  res.render('about');
});

router.get('/about', function (req, res) {
  res.render('about');
});

router.get('/search', function (req, res) {
  res.render('search');
});

router.get('/search/username', function (req, res) {
  Account.findByUsername(req.body.username, function(err, usr){
    if(!err){
      if(usr){
        res.render('/user/' + usr.username);
      }
    }
  });
  res.render('search');
});

router.get('/updatephoto/:imageid', function (req, res){
  Image.findById(req.params.imageid,function(err, img){
    res.render('update-photo', {imgid: req.params.imageid, imgtitle: img.title});
  });
});

/*
 router.post('/delete/:commentid/:imageid/:userid/:index', function (req, res){
 Image.findById(req.params.imageid,function(err, img){
 if(img){
 if(req.user){

 Image.findByIdAndUpdate(req.params.imageid, { $pull: { 'comments': { _id: req.params.commentid } }}, function(err,model){
 if(err){
 return res.render('error', {message: "Could not retrieve account"});
 }else{
 Comment.findById(req.params.imageid, function(err, comt) {
 if (comt) {
 comt.remove();
 }
 });
 }
 });

 //finally, update the account with the updated image
 Account.findOneAndUpdate(
 { "_id": req.params.userid, "images._id": req.params.imageid},
 {
 "$set": {
 "images.$": img
 }
 },
 function(err,doc) {
 if(err){
 res.render('error', {message: "ERROR"});
 }
 }
 );
 res.redirect('/images/'+req.params.userid + '/' + (parseInt(req.params.index)+1));
 console.log("congrats");
 }else{
 return res.render('error', {message: "Must be logged in to comment", picture: '/images/'+req.params.userid + '/' + (parseInt(req.params.index)+1)});
 }

 }else{
 console.log("cannot find image");
 }

 });
 });
 */
router.post('/comment/:imageid/:userid/:index', function (req, res){
  Image.findById(req.params.imageid,function(err, img){
    if(img){
      if(req.user){
        //create a new comment
        var comment = new Comment({userid: req.user.id, content: req.body.comment, image: req.params.imageid, username: req.user.username, propic: req.user.propic});
        //save it in the database
        comment.save(function(err){
          if(err){
            console.log("error commenting");
          }else{
            console.log("successful comment");
          }
        });
        //add it to the image
        img.comments.push(comment);
        //save the changes
        img.save(function(err){
          if(err){
            console.log("error commenting");
          }else{
            console.log("successful comment");
          }
        });
        //finally, update the account with the updated image
        Account.findOneAndUpdate(
            { "_id": req.params.userid, "images._id": req.params.imageid},
            {
              "$set": {
                "images.$": img
              }
            },
            function(err,doc) {
              if(err){
                res.render('error', {message: "ERROR"});
              }
            }
        );
        res.redirect('/images/'+req.params.userid + '/' + (parseInt(req.params.index)));
        console.log("congrats");
      }else{
        return res.render('error', {message: "Must be logged in to comment", picture: '/images/'+req.params.userid + '/' + (parseInt(req.params.index))});
      }

    }else{
      console.log("cannot find image");
    }

  });
});

//INPROGRESS
router.get('/contact', function (req, res) {
  res.render('contact');
});

//receives the register view which has a register form
router.get('/register', function(req, res) {
  res.render('register', { });
});

//receives the register view which has a register form
router.get('/explore', function(req, res) {
  // Find "limit" random documents (defaults to array of 1)

  var filter = { images: { $exists: true, $not: {$size: 0}}, propic: {$exists: true, $ne: ''} };
  Account.findRandom(filter, {}, {skip: 0, limit: 4}, function(err, results) {
    if (!err) {
      console.log(results[1].username); // 5 elements
      return res.render('explore', {users: results, currentuser: req.user});
    }else{
      console.log("error");
      return res.render('error', {message: "Explore Failed"});
    }
  });
  /*
  Image.findRandom({}, {}, {limit: 20}, function(err, results) {
    if (!err) {
      console.log(results); // 5 elements
      return res.render('explore', {images: results, currentuser: req.user});
    }

  });
*/
});

//all of the register form information is then passed to a new Account model, and redirected to the index view, but this time will be prompted with
//a view of their profile
router.post('/register', function(req, res) {

  //handling the case of user not having a pro pic
  var profilepic;
  if(req.body.propic == "")
  {
    //temporary fix
    profilepic = "/img/templogo.png";
  }else{
    profilepic = req.body.propic;
  }

  //registers a new account with the following information complete from the form
  Account.register(new Account({ username : req.body.username, fullname: req.body.name, title : req.body.title, propic: profilepic}), req.body.password, function(err, account) {
    if (err) {
      //if the username is not unique, let them know in "info"
      return res.render("register", {info: "Sorry. That username already exists. Try again."});
    }
    //authenticate and redirect to the index and show the profile
    passport.authenticate('local')(req, res, function () {
      res.redirect('/');
    });
  });
});

//gets the login page and passes it the logged in user
router.get('/login', function(req, res) {
  res.render('login', { user : req.user });
});


//IN PROGRESS
router.get('/update', function(req, res) {
  res.render('update', { user : req.user});
});

//IN PROGRESS
router.get('/upload', function(req, res) {
  res.render('upload', { user : req.user});
});

//send a request to login and handle any errors that may arise
router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return next(err); // will generate a 500 error
    }
    // Generate a JSON response reflecting authentication status
    if (! user) {
      return res.render("login", {info: "Sorry, your credentials are invalid."});
    }
    req.login(user, function(err){
      if(err){
        return next(err);
      }
      return res.redirect("/");
    });
  })(req, res, next);
});
/*
 //attempt to authenticate the user's credentials
 router.post('/login', passport.authenticate('local'), function(req, res) {
 if (err) {
 //if the authentication is not successfull
 return res.render("login", {info: "Invalid Credentials"});
 }else{
 res.redirect('/');
 }
 });
 */

//DELETE PHOTO
router.get('/delete/:imageid',function (req, res, next) {
  Account.findOne({'images._id': req.params.imageid}, {'images.$': 1}, function (err, usr) {
    if (usr) {
      Account.findByIdAndUpdate(usr._id, { $pull: { 'images': { _id: req.params.imageid } }}, function(err,model){
        if(err){
          return res.render('error', {message: "Could not retrieve account"});
        }else{
          Image.findById(req.params.imageid, function(err, img) {
            if (img) {
              img.remove();
            }
          });
          return res.redirect("/");
        }
      });
    }
  });
});

//IMAGE UPDATE
router.post('/image/:imageid/update',function (req, res, next) {
  Image.findById(req.params.imageid, function(err, img){
    if(img){
      //if the user is logged in
      if (req.user)
      {
        //if the title was changed
        if(req.body.title != img.title) {
          img.title = req.body.title;
        }else if(!req.body.title){
          img.title = "Untitled.";
        }
        //save the new object
        img.save(function(err) {
          if (err)
            console.log('error while attempting to update' + img._id);
          else{
            res.redirect('/');
            console.log("updated: " + img._id);
          }
        });
        //after updating the image, find it on the user and replace that image with the new one
        Account.findOneAndUpdate(
            { "_id": req.user.id, "images._id": req.params.imageid},
            {
              "$set": {
                "images.$": img
              }
            },
            function(err,doc) {
              if(err){
                res.render('error', {message: "ERROR"});
              }
            }
        );

      }else{
        res.render('error', {message: "Not logged in"});
      }
    }else{
      res.render('error', {message: "Cannot Find Image"});
    }
  });
});

//IN PROGRESS when a user wants to see another user's profile
router.get('/images/:userid/:index', function (req, res, next) {
  Account.findById(req.params.userid, function(err, usr){
    if(usr)
    {
      var index = parseInt(req.params.index);
      var image = usr.images[index];
      var nextPic;
      var backPic;

      if(index < usr.images.length){
        nextPic = index+1;
      }
      if(index >= usr.images.length-1){
        nextPic = 0;
      }

      if(index > 0){
        backPic = index-1;
      }
      if(index <= 0){
        backPic = usr.images.length-1;
      }
      return res.render("image", {usrimage: image, user: usr, currentuser: req.user, nextPicture: backPic, backPicture: nextPic, index: index});
    }else{
      return res.render("image", {usrimage: image, currentuser: req.user, message: "photo does not exist"});
    }

  });
});
//IN PROGRESS: User update.
router.post('/user/:id/upload', function (req, res) {
  console.log("upload fucntion");
  Account.findById(req.params.id, function(err, usr) {
    if (!usr)
      res.render('error', {message: "Could not retrieve account"});
    else {
      //if the user is logged in
      if (req.user)
      {
        //if the user logged in isnt the one routed to
        if(usr.id!=req.user.id){
          console.log("nice try");
          //if the user id of the logged in user is the same as the one you're accessing
        }else{

          if(!req.body.title){
            newImage = new Image({username: req.user.username, userid: req.user.id, title: "Untitled.", url: req.body.photo, tags: req.body.tags});
          }else{
            newImage = new Image({username: req.user.username, userid: req.user.id, title: req.body.title, url: req.body.photo, tags: req.body.tags});
          }
          newImage.save(function(err) {
            if (err) throw err;

            console.log('Image created!');
          });

          //push the new image onto the user's image array
          usr.images.push(newImage);

          //save user to have the new image object
          usr.save(function(err) {
            if (err)
              console.log('error while attempting to update' + req.user.username);
            else{
              console.log("updated: " + req.user.username);
              req.login(usr, function(err){
                if(err){
                  return next(err);
                }
                return res.redirect("/");
              });
            }
          });
        }
      }else{
        res.render('error', {message: "Not logged in"});
      }
    }
  });

});

//IN PROGRESS: User update.
router.post('/user/:id/update', function (req, res) {
  console.log("hello");
  Account.findById(req.params.id, function(err, usr) {
    if (!usr)
      res.render('error', {message: "Could not retrieve account"});
    else {
      //if the user is logged in
      if (req.user)
      {
        //if the user logged in isnt the one routed to
        if(usr.id!=req.user.id){
          console.log("nice try");

          //if the user id of the logged in user is the same as the one you're accessing
        }else{
          //if the username was changed
          /*
           if(req.body.username != req.user.username) {

           Account.findByUsername(req.body.username, function (err, newUsr) {
           if (!newUsr){
           console.log(true);
           }
           if (newUsr){
           console.log(false);
           }
           });


           //changing the username
           console.log("Changing " + req.user.username + " to " + req.body.username);
           usr.username = req.body.username;
           console.log(usr.username);
           }
           */

          //full name
          if(req.body.name != req.user.fullname)
          {
            console.log("Changing " + req.user.fullname +" to " +req.body.name);
            usr.fullname = req.body.name;
            console.log(usr.fullname);
          }

          //title
          if(req.body.title != req.user.title)
          {
            console.log("Changing " + req.user.title +" to " +req.body.title);
            usr.title = req.body.title;
            console.log(usr.title);
          }

          //picture
          if(req.body.propic != req.user.propic)
          {
            console.log("Changing " + req.user.propic +" to " +req.body.propic);
            usr.propic = req.body.propic;
            console.log(usr.propic);
          }

          //save the new object
          usr.save(function(err) {
            if (err)
              console.log('error while attempting to update' + req.user.username);
            else{
              console.log("updated: " + req.user.username);
              req.login(usr, function(err){
                if(err){
                  return next(err);
                }
                return res.redirect("/");
              });
            }
          });
        }
      }else{
        res.render('error', {message: "Not logged in"});
      }
    }
  });

});

//IN PROGRESS when a user wants to see another user's profile
router.get('/user/:username', function (req, res, next) {
  Account.findByUsername(req.params.username, function(err, usr){
    if(usr)
    {
      return res.render("user", {usr: usr, currentuser: req.user});
    }else{
      return res.render("user", {usr: usr, currentuser: req.user, urlname: req.params.username});
    }

  });
});


//logout user and redirect to home
router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});
router.get('/loggedin', function(req, res) {
  res.send(req.isAuthenticated() ? req.user : '0');
});
router.get('/ping', function(req, res){
  res.status(200).send("pong!");
});


//404 handling
router.use(function(req,res){
  res.render('404');
});

module.exports = router;

