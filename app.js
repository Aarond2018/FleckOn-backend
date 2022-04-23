const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const HttpError = require("./models/http-error");
const usersRoutes = require("./routes/users-routes")
const placesRoutes = require("./routes/places-routes.js")

const app = express();

app.use(bodyParser.json())

app.get((req, res) => {
	res.status(200).json({ status: "success" });
});

app.use("/api/v1/users", usersRoutes)
app.use("/api/v1/places", placesRoutes)

app.all("*", (req, res, next) => {
  const error = new HttpError(`Can't find ${req.originalUrl} on this server`, 404)
  next(error)
})

app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    status: "fail",
    message: err.message || "Something went wrong!"
  })
})

mongoose
	.connect(
		`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.dpoy7.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
	)
	.then(() => {
    app.listen(process.env.PORT || 5000, () => {
      console.log("Connected!..");
    });
  });

