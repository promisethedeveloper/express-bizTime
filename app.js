/** BizTime express application. */

const express = require("express");
const app = express();
const ExpressError = require("./expressError");
const companiesRoute = require("./routes/companies");
const invoicesRoute = require("./routes/invoices");
const industriesRoute = require("./routes/industries");

app.use(express.json());
app.use("/companies", companiesRoute);
app.use("/invoices", invoicesRoute);
app.use("/industries", industriesRoute);

/** 404 handler */
app.use(function (req, res, next) {
	const err = new ExpressError("Not Found", 404);
	return next(err);
});

/** general error handler */
app.use((error, req, res, next) => {
	let status = error.status || 500;
	let message = error.message;

	return res.status(status).json({
		error: message,
		status: status,
	});
});

module.exports = app;
