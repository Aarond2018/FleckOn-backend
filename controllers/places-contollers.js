const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const Place = require("../models/place-model");
const User = require("../models/user-model");
const getCoordinatesForLocation = require("../util/location.js");
const getDataURI = require("../util/getDataURI");
const cloudinary = require("../util/cloudinary");
const { default: mongoose } = require("mongoose");

exports.getPlaceById = async (req, res, next) => {
//check id a place for the given id exist
	let place;
	try {
		place = await Place.findById(req.params.id);
	} catch (error) {
		return next(
			new HttpError("An error occurred, Please try again later", 500)
		);
	}
//return if it doesn't
	if (!place) {
		return next(
			new HttpError("Could not find a place for the provided ID", 404)
		);
	}

	res.status(200).json({
		status: "success",
		data: {
			place,
		},
	});
};

exports.createPlace = async (req, res, next) => {
//check for input validation errors
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return next(
			new HttpError("Invalid inputs passed, please check your data", 422)
		);
	}

	const { title, description, address } = req.body;

	const coordinates = getCoordinatesForLocation(address);

//convert the image file to base64 and upload to Cloudinary 
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

//create an instance of the place
	const newPlace = new Place({
		title,
		description,
		address,
		location: coordinates,
		image: cloudinaryRes.secure_url,
		creator: req.userData.userId,
	});

//find the user trying to create a place
	let user;
	try {
		user = await User.findById(req.userData.userId);
	} catch (error) {
		return next(
			new HttpError("Creating place failed, please try again later", 500)
		);
	}

//return if no user was found
	if (!user) {
		return next(new HttpError("Could not find user for provided id.", 404));
	}

//save the new place to the database and also add the place to the user's places array
	try {
		const session = await mongoose.startSession();
		session.startTransaction();
		await newPlace.save({ session: session });
		user.places.push(newPlace);
		await user.save({ session: session });
		await session.commitTransaction();
	} catch (error) {
		console.log("yyyy");
		return next(new HttpError("Creating place failed, Please try again."));
	}

	res.status(201).json({
		status: "success",
		data: {
			newPlace,
		},
	});
};

exports.getPlacesByUserId = async (req, res, next) => {
//find the user and also popultate the full places object
	let userWithPlaces;
	try {
		userWithPlaces = await User.findById(req.params.id).populate("places");
	} catch (error) {
		return next(
			new HttpError("Fetching places failed, please try again later", 500)
		);
	}

//return if the user for the given id does not exist
	if (!userWithPlaces || userWithPlaces.places.length === 0) {
		return next(
			new HttpError("Could not find places for the provided user id.", 404)
		);
	}

	res.status(200).json({
		status: "success",
		data: {
      places: userWithPlaces.places
    }
	});
};

exports.deletePlaceById = async (req, res, next) => {
//find the place by the given id and populate the full place creator object
	let place;
	try {
		place = await Place.findById(req.params.id).populate("creator");
	} catch (error) {
		return next(
			new HttpError("An error occurred, could not delete place", 500)
		);
	}

//return if a place for the given id was not found
	if (!place) {
		return next(
			new HttpError("Could not find a place for the provided id", 404)
		);
	}

//also return if the person trying to delete the place is not the creator of the place
	if (place.creator.id !== req.userData.userId) {
		return next(new HttpError("You are allowed to delete this place", 401));
	}

//remove the place from the database and remove it from the user's places array
	try {
		const session = await mongoose.startSession();
		await session.startTransaction();
		await place.remove({ session });
		place.creator.places.pull(place);
		await place.creator.save({ session });
		await session.commitTransaction();
	} catch (error) {
		return next(
			new HttpError("Something went wrong, could not delete place.", 500)
		);
	}

	res.status(204).json({
		status: "success",
	});
};


exports.updatePlace = async (req, res, next) => {
//check if there is any input validation error
  const errors = validationResult(req)
  if(!errors.isEmpty()){
		return next(
			new HttpError("Invalid inputs passed, please check your data", 422)
		);
	}

  const {title, description} = req.body

//find the place for the given id
  let place;
  try {
    place = await Place.findById(req.params.id)
  } catch (error) {
    return next(new HttpError("Something went wrong, try again", 500))
  }

//return if a place wasn't found
  if(!place) {
    return next(new HttpError("This place is not recorded in the database", 404))
  }

//alow only the creator of the place to edit the place
  if(req.userData.userId !== place.creator.toString()) {
    return next(new HttpError("You are not allowed to edit this place.", 401))
  }

  place.title = title
  place.description = description

//save the updated place
  try {
    await place.save();
  } catch (error) {
    return next(new HttpError('Something went wrong, could not update place.', 500))
  }

  res.status(200).json({
    status: "success",
    data: {
      place
    }
  })

}
