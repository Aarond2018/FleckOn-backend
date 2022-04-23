const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const Place = require("../models/place-model");
const User = require("../models/user-model");
const getCoordinatesForLocation = require("../util/location.js");
const getDataURI = require("../util/getDataURI");
const cloudinary = require("../util/cloudinary");
const { default: mongoose } = require("mongoose");

exports.getPlaceById = async (req, res, next) => {
  let place;
  try {
    place = await Place.findById(req.params.id)
  } catch (error) {
    return next(new HttpError("An error occurred, Please try again later", 500))
  }

  if(!place) {
    return next(new HttpError("Could not find a place for the provided ID", 404))
  }

  res.status(200).json({
    status: "success",
    data: {
      place
    }
  })
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

exports.deletePlaceById = async (req, res, next) => {
  let place;
  try {
    place = await Place.findById(req.params.id).populate("creator")
  } catch (error) {
    return next(new HttpError("An error occurred, could not delete place", 500))
  }

  if (!place) {
    return next(new HttpError("Could not find a place for the provided id", 404))
  }

  if (place.creator.id !== req.userData.userId) {
    return next(new HttpError("You are allowed to delete this place", 401))
  }

  try {
    const session = await mongoose.startSession()
    await session.startTransaction()
    await place.remove( {session} )
    place.creator.places.pull(place)
    await place.creator.save( {session} )
    await session.commitTransaction()
  } catch (error) {
    return next(new HttpError("Something went wrong, could not delete place.", 500))
  }

  res.status(204).json({
    status: "success"
  })
}
