// finduser.js
const express = require("express");
const router = express.Router();
const User = require("../models/User.js");

// @route GET /findUser/abc/:id
// @desc Get user information by userID
// @access Public
router.get("/:id", async (req, res) => {
  console.log(req.params.id);
  try {
    const userID = req.params.id;
    const user = await User.findOne({ userID: userID });
    res.json({ success: true, user: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
