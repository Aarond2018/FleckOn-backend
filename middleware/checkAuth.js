const jwt = require("jsonwebtoken")

const HttpError = require("../models/http-error")

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1]

    if(!token) {
      throw new Error("Authentication token is required") 
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY)
    req.userData = {userId: decodedToken.userId}
    next()
  } catch (error) {
    return next(new HttpError("Authentication failed", 403))
  }
}