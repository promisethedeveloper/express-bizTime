process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany;

beforeEach(async () => {
	let result = await db.query(
		`INSERT INTO 
            companies (code, name, description) VALUES ('oly', 'oloye tech', 'Makers of oly') 
            RETURNING code, name`
	);
	const invoiceTest = await db.query(
		`INSERT INTO 
            invoices (comp_code, amt, paid, add_date, paid_date) 
            VALUES ('oly', 100, false, '2018-01-01', null) 
            RETURNING id`
	);
	const industryTest = await db.query(
		`INSERT INTO 
			industries (code, industry) 
			VALUES ('tech', 'Technology'), ('mktg', 'Marketing')`
	);
	const industryCompaniesTest = await db.query(
		`INSERT INTO 
			industries_companies (industry_code, comp_code) 
			VALUES ('tech', 'oly'), ('mktg', 'oly')`
	);

	testCompany = result.rows[0];
});

afterEach(async () => {
	// delete any data created by test
	await db.query("DELETE FROM companies");
	await db.query("DELETE FROM invoices");
	await db.query("DELETE FROM industries");
	await db.query("DELETE FROM industries_companies");
	await db.query("SELECT setval('invoices_id_seq', 1, false)");
});

afterAll(async () => {
	// close db connection
	await db.end();
});

describe("GET /", () => {
	test("It should return all companies", async () => {
		const res = await request(app).get("/companies");
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({
			companies: [testCompany],
		});
	});
});

describe("GET /:code", () => {
	test("It should return a company", async () => {
		const res = await request(app).get(`/companies/${testCompany.code}`);
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({
			company: {
				code: "oly",
				name: "oloye tech",
				description: "Makers of oly",
				invoices: [1],
				industries: ["Technology", "Marketing"],
			},
		});
	});
	test("It should return 404 if the company does not exist", async () => {
		const res = await request(app).get(`/companies/abc`);
		expect(res.statusCode).toBe(404);
	});
});

describe("POST /", () => {
	test("It should add a company", async () => {
		const data = {
			code: "puma",
			name: "puma",
			description: "Makers of puma brands",
		};
		const res = await request(app).post(`/companies`).send(data);
		expect(res.statusCode).toBe(201);
		expect(res.body).toEqual({
			company: data,
		});
	});
});

describe("PUT /companies/:code", () => {
	test("It should edit a company", async () => {
		const data = {
			name: "Puma Worldwide",
			description: "Makers of all puma brands",
		};
		const res = await request(app)
			.put(`/companies/${testCompany.code}`)
			.send(data);
		expect(res.statusCode).toBe(201);
		expect(res.body).toEqual({
			company: {
				code: "oly",
				name: "Puma Worldwide",
				description: "Makers of all puma brands",
			},
		});
	});
	test("It should return 404 if the company does not exist", async () => {
		const res = await request(app).put(`/companies/abc`);
		expect(res.statusCode).toBe(404);
	});
});

describe("DELETE /companies/:code", () => {
	test("It should delete a company", async () => {
		const res = await request(app).delete(`/companies/${testCompany.code}`);
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({
			status: "deleted",
		});
	});
	test("It should return 404 if the company does not exist", async () => {
		const res = await request(app).delete(`/companies/0`);
		expect(res.statusCode).toBe(404);
	});
});
