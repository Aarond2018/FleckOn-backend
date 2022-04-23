const mongoose = require("mongoose")

const placeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide a place title"]
  },
  description: {
    type: String,
    required: [true, "Please enter a place desription"]
  },
  address: {
    type: String,
    required: [true, "Please enter an address"]
  },
  location: {
    lat: { type: Number, required: [true, "Please enter a valid location latitude"] },
    lng: { type: Number, required: [true, "Please enter a valid location longitude"] }
  },
  image: {
    type: String,
    required: true
  },
  creator: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "User"
  }
})

module.exports = mongoose.model("Place", placeSchema)