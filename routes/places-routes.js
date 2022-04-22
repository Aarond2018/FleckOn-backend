const express = require("express")

const placesControllers = require("../controllers/places-contollers")

const router = express.Router()


router.post("/", placesControllers.createPlace)

router.get("/:id", placesControllers.getPlaceById)

module.exports = router