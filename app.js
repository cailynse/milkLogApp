var bodyParser = require("body-parser"),
    methodOverride = require("method-override"),
    mongoose = require("mongoose"),
    express = require("express"),
    app = express();



//APP CONFIG
mongoose.connect("mongodb://localhost/milk_log_app");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method"));


//MONGOOSE MODEL CONFIG

//ANIMAL
var animalSchema = new mongoose.Schema({
    image: String,
    name: String,
    variety: String,
    DOB: Date,
    logs: [{
        amount: Number,
        notes: String,
        dateMilked: Date
    }],
    created: { type: Date, default: Date.now }
});

var Animal = mongoose.model("Animal", animalSchema);




//HOME PAGE
app.get("/", function(req, res) {
    res.render("home");
});


//INDEX ROUTES
app.get("/animals", function(req, res) {
    Animal.find({}, function(err, animals) {
        if (err) {
            console.log(err);
            res.render("home");
        }
        else {
            res.render("animals/index", { animals: animals });
        }
    });
});

app.get("/animals/:animalId/logs", function(req, res) {
    Animal.findById(req.params.animalId, function(err, foundAnimal) {
        if (err) {
            console.log(err);
            res.render("home");
        }
        else {
            res.render("logs/index", { animal: foundAnimal });
        }
    });
});



//NEW ROUTES
app.get("/animals/new", function(req, res) {
    res.render("animals/new");
});

app.get("/animals/:animalId/logs/new", function(req, res) {
    Animal.findById(req.params.animalId, function(err, foundAnimal) {
        if (err) {
            res.render("home");
        }
        else {
            res.render("logs/new", { animal: foundAnimal });
        }
    });
});



//CREATE ROUTES
app.post("/animals", function(req, res) {
    Animal.create(req.body.animal, function(err, newAnimal) {
        if (err) {
            res.render("logs/new");
        }
        else {
            res.redirect("/animals");
        }
    });
});

app.post("/animals/:animalId/logs", function(req, res) {
    var logObj = {
        amount: req.body.amount,
        timeMilked: req.body.timeMilked,
        dateMilked: req.body.dateMilked,
        notes: req.body.notes
    };

    Animal.findByIdAndUpdate(req.body.id, { $push: { logs: logObj } }, { new: true }, function(err, foundAnimal) {
        if (err) {
            console.log("ERROR: " + err);
            res.redirect("/");
        }
        else {
            res.render("logs/index", { animal: foundAnimal });
        }

    });
});


//SHOW ROUTES
app.get("/animals/:animalId", function(req, res) {
    Animal.findById(req.params.animalId, function(err, foundAnimal) {
        if (err) {
            console.log(err);
            res.redirect("/");
        }
        else {
            res.render("animals/show", { animal: foundAnimal });
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

app.get("/animals/:animalId/logs/:logId", function(req, res) {
    Animal.findOne({ 'logs._id': req.params.logId },
        function(err, foundAnimal) {
            if (err) {
                console.log(err);
                res.redirect("/");
            }
            else {
                var logs = foundAnimal.logs;
                var foundLog = findLog(logs, req.params.logId);
                foundLog.animalID = foundAnimal._id;
                res.render("logs/show", { log: foundLog });
            }
        });
});


//EDIT ROUTES
app.get("/animals/:animalId/edit", function(req, res) {
    Animal.findById(req.params.animalId, function(err, foundAnimal) {
        if (err) {
            res.render("/");
        }
        else {
            res.render("animals/edit", { animal: foundAnimal });
        }
    });
});

app.get("/animals/:animalId/logs/:logId/edit", function(req, res) {
    Animal.findOne({ 'logs._id': req.params.logId },
        function(err, foundAnimal) {
            if (err) {
                console.log(err);
                res.redirect("/");
            }
            else {
                var logs = foundAnimal.logs;
                var foundLog = findLog(logs, req.params.logId);

                foundLog.animalID = foundAnimal._id;
                foundLog.animalName = foundAnimal.name;
                res.render("logs/edit", { log: foundLog });
            }
        });
});


//UPDATE ROUTES
app.put("/animals/:animalId", function(req, res) {
    Animal.findByIdAndUpdate(req.params.animalId, req.body.animal, function(err, updatedAnimal) {
        if (err) {
            res.redirect("/");
        }
        else {
            res.redirect("/animals/" + req.params.animalId);
        }
    });
});

app.put("/animals/:animalId/logs/:logId", function(req, res) {
    Animal.findOneAndUpdate({ 'logs._id': req.params.logId }, {
        '$set': {
            'logs.$.amount': req.body.amount,
            'logs.$.timeMilked': req.body.timeMilked,
            'logs.$.dateMilked': req.body.dateMilked,
            'logs.$.notes': req.body.notes
        }
    }, { new: true }, function(err, foundAnimal) {
        if (err) {
            console.log(err);
            res.redirect("/");
        }
        else {
            var logs = foundAnimal.logs;
            var foundLog = findLog(logs, req.params.logId);
            foundLog.animalID = foundAnimal._id;
            foundLog.animalName = foundAnimal.name;
            res.render("logs/show", { log: foundLog });
        }
    });
});


//DELETE ROUTES
app.delete("/animals/:animalId", function(req, res) {
    Animal.findByIdAndRemove(req.params.animalId, function(err) {
        if (err) {
            res.redirect("/");
        }
        else {
            res.redirect("/animals");
        }
    });
});

app.delete("/animals/:animalId/logs/:logId", function(req, res) {
    Animal.findOneAndUpdate({ 'logs._id': req.params.logId }, {
            $pull: {
                "logs": { "_id": req.params.logId }
            }
        }, { safe: true },
        function(err, foundAnimal) {
            if (err) {
                console.log(err);
                res.redirect("/");
            }
            else {
                res.redirect("/animals/" + foundAnimal._id + "/logs");
            }
        });
});


app.listen(process.env.PORT, process.env.IP, function() {
    console.log("MILK LOG SERVER IS RUNNING");
});
