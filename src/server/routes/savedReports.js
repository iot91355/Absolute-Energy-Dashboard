const express = require('express');
const { getConnection } = require('../db');
const router = express.Router();

// Ensure table exists on first use
async function ensureTable(db) {
	await db.none(`
		CREATE TABLE IF NOT EXISTS saved_reports (
			id            SERIAL PRIMARY KEY,
			saved_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			bill_month    TEXT,
			period_start  TEXT,
			period_end    TEXT,
			meter_name    TEXT,
			target_name   TEXT,
			total_kvah    NUMERIC,
			total_kwh     NUMERIC,
			energy_charges NUMERIC,
			wheeling_charges NUMERIC,
			tod_ec        NUMERIC,
			demand_charges NUMERIC,
			fac           NUMERIC,
			electricity_duty NUMERIC,
			tax_on_sale   NUMERIC,
			excess_demand NUMERIC,
			grand_total   NUMERIC,
			power_factor  NUMERIC,
			billed_demand NUMERIC,
			actual_demand NUMERIC,
			report_json   JSONB,
			created_by    TEXT,
			pdf_data      TEXT 
		);
		DO $$ 
		BEGIN 
			IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='saved_reports' AND column_name='created_by') THEN
				ALTER TABLE saved_reports ADD COLUMN created_by TEXT;
			END IF;
			IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='saved_reports' AND column_name='pdf_data') THEN
				ALTER TABLE saved_reports ADD COLUMN pdf_data TEXT;
			END IF;
		END $$;
	`);
}

// GET /api/saved-reports — list all, newest first
router.get('/', async (req, res) => {
	try {
		const db = getConnection();
		await ensureTable(db);
		const rows = await db.any(
			`SELECT id, saved_at, bill_month, period_start, period_end, meter_name, target_name,
			        total_kvah, total_kwh, energy_charges, wheeling_charges, tod_ec,
			        demand_charges, fac, electricity_duty, tax_on_sale, excess_demand,
			        grand_total, power_factor, billed_demand, actual_demand, created_by
			 FROM saved_reports ORDER BY saved_at DESC`
		);
		res.json(rows);
	} catch (err) {
		console.error('Error listing saved reports:', err);
		res.status(500).json({ error: err.message });
	}
});

// GET /api/saved-reports/:id/pdf — get the PDF data
router.get('/:id/pdf', async (req, res) => {
	try {
		const db = getConnection();
		const row = await db.oneOrNone('SELECT pdf_data, bill_month FROM saved_reports WHERE id = $1', [req.params.id]);
		if (!row) return res.status(404).json({ error: 'Report not found' });
		res.json({ pdfData: row.pdf_data, billMonth: row.bill_month });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// POST /api/saved-reports — save a new report
router.post('/', async (req, res) => {
	try {
		const db = getConnection();
		await ensureTable(db);
		const d = req.body;
		const row = await db.one(
			`INSERT INTO saved_reports
			  (bill_month, period_start, period_end, meter_name, target_name,
			   total_kvah, total_kwh, energy_charges, wheeling_charges, tod_ec,
			   demand_charges, fac, electricity_duty, tax_on_sale, excess_demand,
			   grand_total, power_factor, billed_demand, actual_demand, report_json, created_by, pdf_data)
			 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
			 RETURNING *`,
			[
				d.billMonth, d.periodStart, d.periodEnd, d.meterName, d.targetName,
				d.totalKvah, d.totalKwh, d.energyCharges, d.wheelingCharges, d.todEc,
				d.demandCharges, d.fac, d.electricityDuty, d.taxOnSale, d.excessDemand,
				d.grandTotal, d.powerFactor, d.billedDemand, d.actualDemand,
				JSON.stringify(d.fullReport),
				d.createdBy || 'ADMIN',
				d.pdfData || ''
			]
		);
		res.json(row);
	} catch (err) {
		console.error('Error saving report:', err);
		res.status(500).json({ error: err.message });
	}
});

// DELETE /api/saved-reports/:id
router.delete('/:id', async (req, res) => {
	try {
		const db = getConnection();
		await db.none('DELETE FROM saved_reports WHERE id = $1', [req.params.id]);
		res.sendStatus(200);
	} catch (err) {
		console.error('Error deleting report:', err);
		res.status(500).json({ error: err.message });
	}
});

module.exports = router;
