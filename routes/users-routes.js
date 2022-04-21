const express = require("express")
const { check } = require("express-validator")

const usersControllers = require("../controllers/users-controllers")
const upload = require("../middleware/file-upload")

const router = express.Router()


router.get("/", usersControllers.getAllUsers)

router.post("/signup",
upload.single("image"),
[
  check('name')
    .not()
    .isEmpty(),
  check('email')
    .normalizeEmail()
    .isEmail(),
  check('password').isLength({ min: 6 })
], usersControllers.signup)

router.post("/login", usersControllers.login)


module.exports = router