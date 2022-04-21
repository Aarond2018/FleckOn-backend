const mongoose = require("mongoose")
const validator = require("validator")

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: [true, "Please provide an email"],
    validate: [validator.isEmail, "Please provide a valid email"]
  },
  password: {
    type: String,
    required: [true, "Please provide a valid password"],
    minlength: [6, "The password must not be less than 6 characters"]
  },
  image: {
    type: String,
    // required: [true, "Please provide an image"]
  },
  places: {
    type: [String]
  },
  createdAt: {
    type: Date,
    default: Date.now()
  }
})

module.exports = mongoose.model("User", userSchema)