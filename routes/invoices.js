const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

router.get("/", async (req, res, next) => {
	try {
		const result = await db.query(`SELECT id, comp_code FROM invoices`);
		return res.status(200).json({
			invoices: result.rows,
		});
	} catch (error) {
		return next(error);
	}
});

router.get("/:id", async (req, res, next) => {
	try {
		const result = await db.query(
			`SELECT id, comp_code, amt, paid, add_date, paid_date, code, name, description 
                FROM invoices JOIN companies 
                ON invoices.comp_code=companies.code 
                WHERE id=$1`,
			[+req.params.id]
		);
		if (result.rows.length === 0)
			throw new ExpressError("Cannot find invoice", 404);
		const data = result.rows[0];
		const invoice = {
			id: data.id,
			amt: data.amt,
			paid: data.paid,
			add_date: data.add_date,
			paid_date: data.paid_date,
			company: {
				code: data.comp_code,
				name: data.name,
				description: data.description,
			},
		};
		return res.status(200).json({ invoice });
	} catch (error) {
		return next(error);
	}
});

router.post("/", async (req, res, next) => {
	try {
		const { comp_code, amt } = req.body;
		const result = await db.query(
			`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_Code, amt, paid, add_date, paid_date`,
			[comp_code, amt]
		);
		return res.status(201).json({
			invoice: result.rows[0],
		});
	} catch (error) {
		return next(error);
	}
});

router.put("/:id", async (req, res, next) => {
	try {
		const { id } = req.params;
		const { amt, paid } = req.body;
		let paidDate = null;

		const currResult = await db.query(
			`SELECT paid FROM invoices WHERE id = $1`,
			[id]
		);

		if (currResult.rows.length === 0)
			throw new ExpressError("Cannot find invoice", 404);

		const currPaidDate = currResult.rows[0].paid_date;

		if (!currPaidDate && paid) {
			paidDate = new Date();
		} else if (!paid) {
			paidDate = null;
		} else {
			paidDate = currPaidDate;
		}

		const result = await db.query(
			`UPDATE invoices SET amt=$1, paid=$2, paid_date=$3 WHERE id=$4 RETURNING id, comp_code, amt, paid, add_date, paid_date`,
			[amt, paid, paidDate, id]
		);
		return res.status(200).json({
			invoice: result.rows[0],
		});
	} catch (error) {
		return next(error);
	}
});

router.delete("/:id", async (req, res, next) => {
	try {
		const { id } = req.params;
		const result = await db.query(
			`DELETE FROM invoices WHERE id=$1 RETURNING id`,
			[+id]
		);
		if (result.rows.length === 0)
			throw new ExpressError("Cannot find invoice", 404);
		return res.status(200).json({ status: "deleted" });
	} catch (error) {
		return next(error);
	}
});

module.exports = router;
