const express = require("express");
const router = express.Router();
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const verifyToken = require("../middleware/auth");

const User = require("../models/User.js");

async function getMaxUserID() {
  try {
    // Sử dụng phương thức findOne và sắp xếp giảm dần theo postOfficeID để lấy giá trị lớn nhất
    const maxUser = await User.findOne({}).sort({ userID: -1 });

    if (maxUser) {
      return maxUser.userID;
    } else {
      return 0; // Trường hợp không có postOffice nào tồn tại, trả về 0 hoặc giá trị mặc định khác
    }
  } catch (error) {
    console.error(error);
    return 0; // Trong trường hợp lỗi, trả về 0 hoặc một giá trị mặc định
  }
}

// @route GET user/role
// @desc Check if user is logged in
// @access Public
router.get("/role", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ userID: req.userID }).select("-password");

    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "User not found" });

    let locationID;
    if (user.role === "officeStaff" || user.role === "officeManager") {
      res.json({
        success: true,
        role: req.role,
        postOfficeID: user.postOfficeID,
      });
    } else if (
      user.role === "warehouseStaff" ||
      user.role === "warehouseManager"
    ) {
      res.json({
        success: true,
        role: req.role,
        warehouseID: user.warehouseID,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// @route POST user/register
// @desc Register user
// @access Public
router.post("/register", async (req, res) => {
  const {
    username,
    password,
    name,
    email,
    birthdate,
    postOfficeID,
    warehouseID,
    role,
  } = req.body;

  // Simple validation
  if (!username || !password)
    return res
      .status(400)
      .json({ success: false, message: "Missing username and/or password" });

  try {
    // Check for existing user
    const user = await User.findOne({ username: username });

    if (user)
      return res
        .status(400)
        .json({ success: false, message: "Username already taken" });

    // All good
    const hashedPassword = await argon2.hash(password);
    const userID = (await getMaxUserID()) + 1;
    const newUser = new User({
      userID,
      username,
      password: hashedPassword,
      userID,
      name,
      email,
      birthdate,
      postOfficeID,
      warehouseID,
      role,
    });

    await newUser.save();

    // Return token
    const accessToken = jwt.sign(
      { userID: userID, role: role },
      process.env.ACCESS_TOKEN_SECRET
    );

    res.json({
      success: true,
      message: "User created successfully",
      newUser,
      accessToken,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// @route POST user/login
// @desc Login user
// @access Public
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  // Simple validation
  if (!username || !password)
    return res
      .status(400)
      .json({ success: false, message: "Missing username and/or password" });
  try {
    // Check for existing user
    const user = await User.findOne({ username: username });

    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "Incorrect username or password1" });

    // Username found
    const passwordValid = await argon2.verify(user.password, password);
    if (!passwordValid)
      return res
        .status(400)
        .json({ success: false, message: "Incorrect username or password" });

    // All good
    // Return token
    const accessToken = jwt.sign(
      { userID: user.userID, role: user.role },
      process.env.ACCESS_TOKEN_SECRET
    );

    res.json({
      success: true,
      message: "User logged in successfully",
      accessToken,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// @route GET user/officeStaff/postOfficeID
// @desc Get office staff of a post office
// @access Public
router.get("/officeStaff/:postOfficeID", async (req, res) => {
  const postOfficeID = parseInt(req.params.postOfficeID);

  try {
    const officeStaffs = await User.find({
      postOfficeID: postOfficeID,
      role: "officeStaff",
    });
    if (!officeStaffs) {
      return res
        .status(404)
        .json({ success: false, message: "OfficeStaff not found" });
    }

    res.json({ success: true, officeStaffs: officeStaffs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// @route PUT user/:id
// @desc Update user
// @access Public
router.put("/:id", async (req, res) => {
  const userID = req.params.id;
  const updateData = req.body;
  const hashedPassword = await argon2.hash(updateData.password);
  updateData.password = hashedPassword;

  try {
    const updatedUser = await User.findOneAndUpdate(
      { userID: userID },
      updateData,
      { new: true }
    );
    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({ success: true, updatedUser: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// @route Delete user/:id
// @desc Update user
// @access Public
router.delete("/:id", async (req, res) => {
  const userID = req.params.id;

  try {
    const deletedUser = await User.findOneAndDelete({ userID: userID });

    if (!deletedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({ success: true, deletedUser: deletedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// @route GET user/warehouseStaff/warehouseID
// @desc Get warehouseStaffs of a warehouse
// @access Public
router.get("/warehouseStaff/:warehouseID", async (req, res) => {
  const warehouseID = parseInt(req.params.warehouseID);

  try {
    const warehouseStaffs = await User.find({
      warehouseID: warehouseID,
      role: "warehouseStaff",
    });
    if (!warehouseStaffs) {
      return res
        .status(404)
        .json({ success: false, message: "WarehouseStaff not found" });
    }

    res.json({ success: true, warehouseStaffs: warehouseStaffs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
