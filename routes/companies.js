const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

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
			`SELECT code, name, description FROM companies WHERE code=$1`,
			[code]
		);
		if (result.rows.length === 0)
			throw new ExpressError("Cannot find company", 404);
		return res.status(200).json({
			company: result.rows[0],
		});
	} catch (error) {
		return next(error);
	}
});

router.post("/", async (req, res, next) => {
	try {
		const { code, name, description } = req.body;
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
