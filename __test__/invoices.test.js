process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testInvoice;

beforeEach(async () => {
	const companyTest = await db.query(
		`INSERT INTO 
            companies (code, name, description) VALUES ('oly', 'oloye tech', 'Makers of oly') 
            RETURNING code, name, description`
	);

	const invoiceTest = await db.query(
		`INSERT INTO 
            invoices (comp_code, amt, paid, add_date, paid_date) 
            VALUES ('oly', 100, false, '2018-01-01', null) 
            RETURNING id`
	);
	testInvoice = invoiceTest.rows[0];
});

afterEach(async () => {
	// delete any data created by test
	await db.query("DELETE FROM invoices");
	await db.query("DELETE FROM companies");
	await db.query("SELECT setval('invoices_id_seq', 1, false)");
});

afterAll(async () => {
	// close db connection
	await db.end();
});

describe("GET /invoices", () => {
	test("It should return all invoices", async () => {
		const res = await request(app).get("/invoices");
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({
			invoices: [
				{
					id: 1,
					comp_code: "oly",
				},
			],
		});
	});
});

describe("GET /invoices/:id", () => {
	test("It should return an invoice", async () => {
		const res = await request(app).get(`/invoices/${testInvoice.id}`);
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({
			invoice: {
				id: 1,
				amt: 100,
				add_date: expect.any(String),
				paid: false,
				paid_date: null,
				company: {
					code: "oly",
					name: "oloye tech",
					description: "Makers of oly",
				},
			},
		});
	});
	test("It should return 404 if the invoice is not found", async () => {
		const res = await request(app).get(`/invoices/0`);
		expect(res.statusCode).toBe(404);
		expect(res.body).toEqual({
			error: "Cannot find invoice",
			status: 404,
		});
	});
});

describe("POST /invoices", () => {
	test("It should add an invoice", async () => {
		const res = await request(app)
			.post(`/invoices`)
			.send({ comp_code: "oly", amt: 200 });
		expect(res.statusCode).toBe(201);
		expect(res.body).toEqual({
			invoice: {
				id: 2,
				comp_code: "oly",
				amt: 200,
				paid: false,
				add_date: expect.any(String),
				paid_date: null,
			},
		});
	});
});

describe("PUT /invoices/:id", () => {
	test("It should edit an invoice", async () => {
		const res = await request(app)
			.put(`/invoices/${testInvoice.id}`)
			.send({ amt: 300 });
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({
			invoice: {
				id: 1,
				comp_code: "oly",
				amt: 300,
				paid: false,
				add_date: expect.any(String),
				paid_date: null,
			},
		});
	});
	test("It should return 404 if the invoice is not found", async () => {
		const res = await request(app).put(`/invoices/0`).send({ amt: 300 });
		expect(res.statusCode).toBe(404);
		expect(res.body).toEqual({
			error: "Cannot find invoice",
			status: 404,
		});
	});
});

describe("DELETE /invoice/:id", () => {
	test("It should delete an invoice", async () => {
		const res = await request(app).delete(`/invoices/${testInvoice.id}`);
		expect(res.statusCode).toBe(200);
	});
	test("It should return 404 if the invoice is not found", async () => {
		const res = await request(app).delete(`/invoices/0`);
		expect(res.statusCode).toBe(404);
		expect(res.body).toEqual({
			error: "Cannot find invoice",
			status: 404,
		});
	});
});
