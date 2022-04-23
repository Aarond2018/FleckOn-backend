const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const Place = require("../models/place-model");
const User = require("../models/user-model");
const getCoordinatesForLocation = require("../util/location.js");
const getDataURI = require("../util/getDataURI");
const cloudinary = require("../util/cloudinary");
const { default: mongoose } = require("mongoose");

exports.getPlaceById = async (req, res, next) => {
	console.log(req.params.id);
};

exports.createPlace = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return next(
			new HttpError("Invalid inputs passed, please check your data", 422)
		);
	}

	const { title, description, address } = req.body;

	const coordinates = getCoordinatesForLocation(address);

	let cloudinaryRes;
	try {
		const dataURI = getDataURI(req.file);
		cloudinaryRes = await cloudinary.uploader.upload(dataURI, {
			folder: "fleckOn/places",
		});
		console.log(cloudinaryRes);
	} catch (error) {
		return next(new HttpError("Could create place, Please try again", 500));
	}

	const newPlace = new Place({
		title,
		description,
		address,
		location: coordinates,
		image: cloudinaryRes.secure_url,
		creator: req.userData.userId,
	});

	let user;
	try {
		user = await User.findById(req.userData.userId);
	} catch (error) {
		return next(
			new HttpError("Creating place failed, please try again later", 500)
		);
	}

	if (!user) {
		return next(new HttpError("Could not find user for provided id.", 404));
	}

	try {
		const session = await mongoose.startSession();
		session.startTransaction();
		await newPlace.save({ session: session });
		user.places.push(newPlace);
		await user.save({ session: session });
		await session.commitTransaction();
	} catch (error) {
    console.log("yyyy")
		return next(new HttpError("Creating place failed, Please try again."));
	}

  res.status(201).json({
    status: "success",
    data: {
      newPlace
    }
  })
};
