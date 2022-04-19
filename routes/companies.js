const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");
const slugify = require("slugify");

router.get("/", async (req, res, next) => {
	try {
		const result = await db.query(`SELECT code, name FROM companies`);
		return res.status(200).json({
			companies: result.rows,
		});
	} catch (error) {
		return next(error);
	}
});

router.get("/:code", async (req, res, next) => {
	try {
		const { code } = req.params;
		const result = await db.query(
			`SELECT code, name, description FROM companies WHERE code = $1`,
			[code]
		);
		const invoice = await db.query(
			`SELECT id FROM invoices WHERE comp_code=$1`,
			[code]
		);

		const industry_company = await db.query(
			`SELECT industry 
				FROM industries AS i 
				JOIN industries_companies AS ic 
				ON i.code=ic.industry_code
				WHERE comp_code=$1`,
			[code]
		);

		const industriesArray =
			industry_company.rows.length === 0
				? null
				: industry_company.rows.map((i) => i.industry);

		if (result.rows.length === 0)
			throw new ExpressError("Cannot find company", 404);

		let invoicesArray = invoice.rows.map((i) => i.id);

		result.rows[0].invoices = invoicesArray;
		result.rows[0].industries = industriesArray;

		return res.status(200).json({
			company: result.rows[0],
		});
	} catch (error) {
		return next(error);
	}
});

router.post("/", async (req, res, next) => {
	try {
		const { name, description } = req.body;
		const code = slugify(req.body.name, {
			remove: /[*+~.()'"!:@]/g,
			lower: true,
		});
		const result = await db.query(
			`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`,
			[code, name, description]
		);
		return res.status(201).json({
			company: result.rows[0],
		});
	} catch (error) {
		return next(error);
	}
});

router.put("/:code", async (req, res, next) => {
	try {
		const { code } = req.params;
		const { name, description } = req.body;
		const result = await db.query(
			`UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description`,
			[name, description, code]
		);
		if (result.rows.length === 0)
			throw new ExpressError("Cannot find company", 404);
		return res.status(201).json({
			company: result.rows[0],
		});
	} catch (error) {
		return next(error);
	}
});

router.delete("/:code", async (req, res, next) => {
	try {
		const { code } = req.params;
		const result = await db.query(
			`DELETE FROM companies WHERE code=$1 RETURNING code`,
			[code]
		);
		if (result.rows.length === 0)
			throw new ExpressError("Cannot find company", 404);
		return res.status(200).json({
			status: "deleted",
		});
	} catch (error) {
		return next(error);
	}
});

module.exports = router;
