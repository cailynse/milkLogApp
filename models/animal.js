var mongoose = require("mongoose");

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
    created: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Animal", animalSchema);
