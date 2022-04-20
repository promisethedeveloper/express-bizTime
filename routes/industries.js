const express = require("express");
const db = require("../db");
const router = new express.Router();

// Adding an industry
router.post("/", async (req, res, next) => {
	try {
		const { code, industry } = req.body;
		const result = await db.query(
			`
        INSERT INTO industries (code, industry)
        VALUES ($1, $2) RETURNING code, industry`,
			[code, industry]
		);
		return res.status(201).json({
			created: result.rows[0],
		});
	} catch (error) {
		return next(error);
	}
});

router.get("/", async (req, res, next) => {
	try {
		const result = await db.query(`SELECT * FROM industries`);
		return res.status(200).json({
			industries: result.rows,
		});
	} catch (error) {
		return next(error);
	}
});

// Associating an industry to a company
router.post("/add-company", async (req, res, next) => {
	try {
		const { industry_code, comp_code } = req.body;
		const result = await db.query(
			`INSERT INTO industries_companies (industry_code, comp_code) VALUES ($1, $2) RETURNING industry_code, comp_code`,
			[industry_code, comp_code]
		);
		return res.json({ industry_and_company: result.rows });
	} catch (e) {
		return next(e);
	}
});

module.exports = router;
