const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// GET ALL SUPPLIERS
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT supplier_id, name, email, phone,
             avg_lead_days, rating, created_at
      FROM stockvault.supplier
      ORDER BY name
    `);

    res.json({
      success: true,
      count: result.rowCount,
      data: result.rows
    });
  } catch (error) {
    console.error("Suppliers API error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch suppliers"
    });
  }
});

// CREATE SUPPLIER
router.post("/", async (req, res) => {
  const { name, email, phone, avg_lead_days, rating } = req.body;

  const leadDays = avg_lead_days === undefined || avg_lead_days === ""
    ? 7 : Number(avg_lead_days);

  const supplierRating = rating === undefined || rating === ""
    ? null : Number(rating);

  if (!name || !name.trim() || name.trim().length > 120) {
    return res.status(400).json({
      success: false,
      message: "Valid supplier name is required (maximum 120 characters)"
    });
  }

  if (email && email.length > 160) {
    return res.status(400).json({
      success: false,
      message: "Email cannot exceed 160 characters"
    });
  }

  if (phone && phone.length > 25) {
    return res.status(400).json({
      success: false,
      message: "Phone cannot exceed 25 characters"
    });
  }

  if (!Number.isInteger(leadDays) || leadDays < 0) {
    return res.status(400).json({
      success: false,
      message: "Average lead days must be a non-negative integer"
    });
  }

  if (
    supplierRating !== null &&
    (!Number.isFinite(supplierRating) || supplierRating < 1 || supplierRating > 5)
  ) {
    return res.status(400).json({
      success: false,
      message: "Rating must be between 1 and 5"
    });
  }

  try {
    const result = await pool.query(`
      INSERT INTO stockvault.supplier
        (name, email, phone, avg_lead_days, rating)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      name.trim(),
      email?.trim() || null,
      phone?.trim() || null,
      leadDays,
      supplierRating
    ]);

    res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Create supplier error:", error.message);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "A supplier with this email already exists"
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create supplier"
    });
  }
});

// UPDATE SUPPLIER
router.put("/:id", async (req, res) => {
  const { name, email, phone, avg_lead_days, rating } = req.body;

  const leadDays = avg_lead_days === undefined || avg_lead_days === ""
    ? 7 : Number(avg_lead_days);

  const supplierRating = rating === undefined || rating === ""
    ? null : Number(rating);

  if (!name || !name.trim() || name.trim().length > 120) {
    return res.status(400).json({
      success: false,
      message: "Valid supplier name is required"
    });
  }

  if (email && email.length > 160) {
    return res.status(400).json({
      success: false,
      message: "Email cannot exceed 160 characters"
    });
  }

  if (phone && phone.length > 25) {
    return res.status(400).json({
      success: false,
      message: "Phone cannot exceed 25 characters"
    });
  }

  if (!Number.isInteger(leadDays) || leadDays < 0) {
    return res.status(400).json({
      success: false,
      message: "Average lead days must be a non-negative integer"
    });
  }

  if (
    supplierRating !== null &&
    (!Number.isFinite(supplierRating) || supplierRating < 1 || supplierRating > 5)
  ) {
    return res.status(400).json({
      success: false,
      message: "Rating must be between 1 and 5"
    });
  }

  try {
    const result = await pool.query(`
      UPDATE stockvault.supplier
      SET name = $1,
          email = $2,
          phone = $3,
          avg_lead_days = $4,
          rating = $5
      WHERE supplier_id = $6
      RETURNING *
    `, [
      name.trim(),
      email?.trim() || null,
      phone?.trim() || null,
      leadDays,
      supplierRating,
      req.params.id
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found"
      });
    }

    res.json({
      success: true,
      message: "Supplier updated successfully",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Update supplier error:", error.message);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "A supplier with this email already exists"
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update supplier"
    });
  }
});

module.exports = router;
