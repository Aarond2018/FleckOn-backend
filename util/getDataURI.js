const getDataURI = file => {
	const base64 = Buffer.from(file.buffer).toString("base64");
	let dataURI = "data:" + file.mimetype + ";base64," + base64;

  return dataURI;
};

module.exports = getDataURI
