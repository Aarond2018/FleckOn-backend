const express = require("express");
const { check } = require("express-validator");

const placesControllers = require("../controllers/places-contollers");
const checkAuth = require("../middleware/checkAuth");
const upload = require("../middleware/file-upload");

const router = express.Router();

router.post(
	"/",
	checkAuth,
	upload.single("image"),
	[
		check("title").not().isEmpty(),
		check("description").isLength({ min: 5 }),
		check("address").not().isEmpty(),
	],
	placesControllers.createPlace
);

router.get("/:id", placesControllers.getPlaceById);

router.delete("/:id", checkAuth, placesControllers.deletePlaceById);
router.patch(
	"/:id",
	checkAuth,
	[check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
	placesControllers.updatePlace
);

router.get("/user/:id", placesControllers.getPlacesByUserId);

module.exports = router;
