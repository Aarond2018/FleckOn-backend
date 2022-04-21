const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

const User = require("../models/user-model");
const HttpError = require("../models/http-error");
const getDataURI = require("../util/getDataURI");
const cloudinary = require("../util/cloudinary");

exports.getAllUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password")
  } catch (error) {
    return next("Fetching users failed, please try again.", 500)
  }

  res.status(200).json({
		status: "success",
		data: {
			users
		}
	});
}

exports.signup = async (req, res, next) => {
  //check for validation errors
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return next(
			new HttpError("Invalid inputs passed, please check your data", 422)
		);
	} 

	const { name, email, password, places } = req.body;

//check if a user with the provided email exist
	let existingUser;
	try {
		existingUser = await User.findOne({ email });
	} catch (error) {
		return next(
			new HttpError("Signing up failed, please try again later.", 500)
		);
	}

//return if there is no existing user
	if (existingUser) {
		return next(new HttpError("User already exists, Log in instead.", 422));
	}

//hash the password
	let hashedPassword;
	try {
		hashedPassword = await bcrypt.hash(password, 12);
	} catch (error) {
		return next(new HttpError("Could not create user, please try again", 500));
	}

//convert the image to base64 and upload to cloudinary
	let cloudinaryRes;
	try {
		const dataURI = getDataURI(req.file);
		cloudinaryRes = await cloudinary.uploader.upload(dataURI, {
			folder: "fleckOn/users",
		});
    console.log(cloudinaryRes) 
	} catch (error) {
		return next(new HttpError("Could not sign up, Please try again", 500));
	}

//create an instance for the user
	const newUser = new User({
		name,
		email,
		password: hashedPassword,
		image: cloudinaryRes.secure_url,
		places,
	});


//save the user to the database
	try {
		await newUser.save();
	} catch (error) {
		return next(new HttpError(error.message || "Something went wrong!.", 500));
	}

//generate the JWT token
	let token;
	try {
		token = await jwt.sign(
			{ userId: newUser.id, email: newUser.email },
			process.env.JWT_SECRET_KEY,
			{
				expiresIn: "1h",
			}
		);
	} catch (error) {
		return next(
			new HttpError("Could not complete sign up, please try again", 500)
		);
	}

	res.status(201).json({
		status: "success",
		data: {
			id: newUser.id,
      email: newUser.email,
      token
		},
	});
};

exports.login = (req, res, next) => {};
