var bodyParser = require("body-parser"),
    methodOverride = require("method-override"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    User = require("./models/user"),
    Animal = require("./models/animal"),
    express = require("express"),
    app = express();



//APP CONFIG
mongoose.connect("mongodb://heroku_ng75ng2h:i1iv5q8nm4cm0jf3165ldnpl0e@ds137631.mlab.com:37631/heroku_ng75ng2h");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(methodOverride("_method"));

//PASSPORT CONFIG
app.use(require("express-session")({
    secret: "Goat milk is best!",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//HOME PAGE
app.get("/", function (req, res) {
    res.render("home", {
        currentUser: req.user
    });
});


//INDEX ROUTES
app.get("/animals", isLoggedIn, function (req, res) {
    Animal.find({}, function (err, animals) {
        if (err) {
            console.log(err);
            res.render("home");
        } else {
            res.render("animals/index", {
                animals: animals,
                currentUser: req.user
            });
        }
    });
});

app.get("/animals/:animalId/logs", isLoggedIn, function (req, res) {
    Animal.findById(req.params.animalId, function (err, foundAnimal) {
        if (err) {
            console.log(err);
            res.render("home");
        } else {
            res.render("logs/index", {
                animal: foundAnimal,
                currentUser: req.user
            });
        }
    });
});



//NEW ROUTES
app.get("/animals/new", isLoggedIn, function (req, res) {
    res.render("animals/new", {
        currentUser: req.user
    });
});

app.get("/animals/:animalId/logs/new", isLoggedIn, function (req, res) {
    Animal.findById(req.params.animalId, function (err, foundAnimal) {
        if (err) {
            res.render("home");
        } else {
            res.render("logs/new", {
                animal: foundAnimal,
                currentUser: req.user
            });
        }
    });
});



//CREATE ROUTES
app.post("/animals", isLoggedIn, function (req, res) {
    Animal.create(req.body.animal, function (err, newAnimal) {
        if (err) {
            res.render("logs/new", {
                currentUser: req.user
            });
        } else {
            res.redirect("/animals");
        }
    });
});

app.post("/animals/:animalId/logs", isLoggedIn, function (req, res) {
    var logObj = {
        amount: req.body.amount,
        timeMilked: req.body.timeMilked,
        dateMilked: req.body.dateMilked,
        notes: req.body.notes
    };

    Animal.findByIdAndUpdate(req.body.id, {
        $push: {
            logs: logObj
        }
    }, {
        new: true
    }, function (err, foundAnimal) {
        if (err) {
            console.log("ERROR: " + err);
            res.redirect("/");
        } else {
            res.render("logs/index", {
                animal: foundAnimal,
                currentUser: req.user
            });
        }

    });
});


//SHOW ROUTES
app.get("/animals/:animalId", isLoggedIn, function (req, res) {
    Animal.findById(req.params.animalId, function (err, foundAnimal) {
        if (err) {
            console.log(err);
            res.redirect("/");
        } else {
            res.render("animals/show", {
                animal: foundAnimal,
                currentUser: req.user
            });
        }
    });
});

function findLog(logList, logID) {
    var selectedLog,
        logString;
    for (var i = 0; i < logList.length; i++) {
        logString = logList[i]._id.toString();
        logID = logID.toString();
        if (logString == logID) {
            selectedLog = logList[i];
        }
    }

    return selectedLog;
}

app.get("/animals/:animalId/logs/:logId", isLoggedIn, function (req, res) {
    Animal.findOne({
            'logs._id': req.params.logId
        },
        function (err, foundAnimal) {
            if (err) {
                console.log(err);
                res.redirect("/");
            } else {
                var logs = foundAnimal.logs;
                var foundLog = findLog(logs, req.params.logId);
                foundLog.animalID = foundAnimal._id;
                res.render("logs/show", {
                    log: foundLog,
                    currentUser: req.user
                });
            }
        });
});


//EDIT ROUTES
app.get("/animals/:animalId/edit", isLoggedIn, function (req, res) {
    Animal.findById(req.params.animalId, function (err, foundAnimal) {
        if (err) {
            res.render("/");
        } else {
            res.render("animals/edit", {
                animal: foundAnimal,
                currentUser: req.user
            });
        }
    });
});

app.get("/animals/:animalId/logs/:logId/edit", isLoggedIn, function (req, res) {
    Animal.findOne({
            'logs._id': req.params.logId
        },
        function (err, foundAnimal) {
            if (err) {
                console.log(err);
                res.redirect("/");
            } else {
                var logs = foundAnimal.logs;
                var foundLog = findLog(logs, req.params.logId);

                foundLog.animalID = foundAnimal._id;
                foundLog.animalName = foundAnimal.name;
                res.render("logs/edit", {
                    log: foundLog,
                    currentUser: req.user
                });
            }
        });
});


//UPDATE ROUTES
app.put("/animals/:animalId", isLoggedIn, function (req, res) {
    Animal.findByIdAndUpdate(req.params.animalId, req.body.animal, function (err, updatedAnimal) {
        if (err) {
            res.redirect("/");
        } else {
            res.redirect("/animals/" + req.params.animalId);
        }
    });
});

app.put("/animals/:animalId/logs/:logId", isLoggedIn, function (req, res) {
    Animal.findOneAndUpdate({
        'logs._id': req.params.logId
    }, {
        '$set': {
            'logs.$.amount': req.body.amount,
            'logs.$.timeMilked': req.body.timeMilked,
            'logs.$.dateMilked': req.body.dateMilked,
            'logs.$.notes': req.body.notes
        }
    }, {
        new: true
    }, function (err, foundAnimal) {
        if (err) {
            console.log(err);
            res.redirect("/");
        } else {
            var logs = foundAnimal.logs;
            var foundLog = findLog(logs, req.params.logId);
            foundLog.animalID = foundAnimal._id;
            foundLog.animalName = foundAnimal.name;
            res.render("logs/show", {
                log: foundLog,
                currentUser: req.user
            });
        }
    });
});


//DELETE ROUTES
app.delete("/animals/:animalId", isLoggedIn, function (req, res) {
    Animal.findByIdAndRemove(req.params.animalId, function (err) {
        if (err) {
            res.redirect("/");
        } else {
            res.redirect("/animals");
        }
    });
});

app.delete("/animals/:animalId/logs/:logId", isLoggedIn, function (req, res) {
    Animal.findOneAndUpdate({
            'logs._id': req.params.logId
        }, {
            $pull: {
                "logs": {
                    "_id": req.params.logId
                }
            }
        }, {
            safe: true
        },
        function (err, foundAnimal) {
            if (err) {
                console.log(err);
                res.redirect("/");
            } else {
                res.redirect("/animals/" + foundAnimal._id + "/logs");
            }
        });
});

//AUTH ROUTES

//show register form
app.get("/register", function (req, res) {
    res.render("register", {
        currentUser: req.user
    });
});

//handle sign up logic
app.post("/register", function (req, res) {
    var newUser = new User({
        username: req.body.username
    });
    User.register(newUser, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function () {
            res.redirect("/animals");
        })
    })
});

//Show Login form
app.get("/login", function (req, res) {
    res.render("login", {
        currentUser: req.user
    });
});

//handling login logic
app.post("/login", passport.authenticate("local", {
        successRedirect: "/animals",
        failureRedirect: "/login"
    }),

    function (req, res) {});

//Logout Route
app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/login");
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();

    }
    res.redirect("/login")
}


app.listen(process.env.PORT, process.env.IP, function () {
    console.log("MILK LOG SERVER IS RUNNING");
});
