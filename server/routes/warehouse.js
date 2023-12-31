const express = require("express");
const router = express.Router();
const Warehouse = require("../models/Warehouse"); // Ensure this import is at the top
const PostOffice = require("../models/PostOffice");
const User = require("../models/User.js");
const Order = require("../models/Order.js");

async function getMaxWarehouseID() {
  try {
    // Sử dụng phương thức findOne và sắp xếp giảm dần theo postOfficeID để lấy giá trị lớn nhất
    const maxWarehouse = await Warehouse.findOne({}).sort({ warehouseID: -1 });

    if (maxWarehouse) {
      return maxWarehouse.warehouseID;
    } else {
      return 100; // Trường hợp không có postOffice nào tồn tại, trả về 0 hoặc giá trị mặc định khác
    }
  } catch (error) {
    console.error(error);
    return 100; // Trong trường hợp lỗi, trả về 0 hoặc một giá trị mặc định
  }
}

async function getWarehouseIDByPostOfficeID(postOfficeID) {
  try {
    const postOffice = await PostOffice.findOne({ postOfficeID });
    if (!postOffice) {
      return -1;
    }
    return postOffice.belongToWarehouseID;
  } catch (error) {
    console.error(error);
    return -1; // Trong trường hợp lỗi, trả về 0 hoặc một giá trị mặc định
  }
}

// @route GET /warehouse/all
// @desc Get all warehouses
// @access Public
router.get("/all", async (req, res) => {
  try {
    const warehouses = await Warehouse.find();
    res.json({ success: true, warehouses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// @route GET /warehouse/:warehouseID
// @desc Get warehouse information by warehouseID
// @access Public
router.get("/:warehouseID", async (req, res) => {
  try {
    const warehouseID = req.params.warehouseID;

    // Find the warehouse based on the provided warehouseID
    const warehouse = await Warehouse.findOne({ warehouseID });

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found for the specified warehouseID",
      });
    }

    res.json({
      success: true,
      warehouse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// @route POST /warehouse/new
// @desc Create a new warehouse
// @access Public
router.post("/new", async (req, res) => {
  try {
    const { province, address } = req.body;
    // Simple validation
    if (!province || province === "" || !address || address === "")
      return res
        .status(400)
        .json({ success: false, message: "Missing province" });

    const warehouse = await Warehouse.findOne({ province: province });
    if (warehouse)
      return res
        .status(400)
        .json({ success: false, message: "Province already taken" });

    const newWarehouse = new Warehouse({
      warehouseID: (await getMaxWarehouseID()) + 1,
      province,
      address
    });

    await newWarehouse.save();

    res.json({ success: true, warehouse: newWarehouse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// @route DELETE /warehouse/:warehouseID
// @desc Delete a warehouse by ID
// @access Public
router.delete("/:warehouseID", async (req, res) => {
  try {
    const warehouseID = req.params.warehouseID;

    // Kiểm tra xem post office có tồn tại không
    const existingWarehouse = await Warehouse.findOne({ warehouseID });

    if (!existingWarehouse) {
      return res
        .status(404)
        .json({ success: false, message: "Warehouse not found" });
    }

    // Xoá existingWarehouse
    await existingWarehouse.deleteOne({ warehouseID });
    await PostOffice.deleteMany({ belongToWarehouseID: warehouseID });

    res.json({ success: true, message: "warehouse deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// @route GET /warehouse/manager/:warehouseID
// @desc Get warehouse manager
// @access Public
router.get("/manager/:warehouseID", async (req, res) => {
  try {
    const warehouseID = req.params.warehouseID;

    // Tìm người dùng có role là 'warehouseManager' và warehouseID phù hợp
    const warehouseManager = await User.findOne({
      role: "warehouseManager",
      warehouseID,
    });

    if (!warehouseManager) {
      return res.status(404).json({
        success: false,
        message: "Warehouse manager not found for the specified warehouse",
      });
    }

    res.json({ success: true, warehouseManager });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// @route GET /warehouse/allManager/
// @desc Get all warehouse manager
// @access Public
router.get("/all/warehouseManagers", async (req, res) => {
  try {
    const warehouseManagers = await User.find({ role: "warehouseManager" });

    if (!warehouseManagers) {
      return res
        .status(404)
        .json({ success: false, message: "Warehouse managers not found" });
    }
    res.json({ success: true, warehouseManagers: warehouseManagers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// @route GET /warehouse/all/notHaveWarehouseManagers/
// @desc Get all warehouse manager
// @access Public
router.get("/all/notHaveWarehouseManagers", async (req, res) => {
  try {
    const warehousesWithoutManager = await Warehouse.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "warehouseID",
          foreignField: "warehouseID",
          as: "warehouseUsers",
        },
      },
      {
        $match: {
          warehouseUsers: {
            $not: { $elemMatch: { role: "warehouseManager" } },
          },
        },
      },
      {
        $project: {
          _id: 0, // Exclude _id field from the result
          warehouseID: 1,
          province: 1,
        },
      },
    ]);

    res.json({ success: true, warehousesWithoutManager });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// @route GET /warehouse/all/notHaveWarehouseManagers/
// @desc Get all warehouse manager
// @access Public
router.get("/allOrdersComing/:id", async (req, res) => {
  try {
    const warehouseID = parseInt(req.params.id, 10); // Parse the ID as an integer
    const orders = await Order.find({
      $or: [{ processTime: { $size: 2 } }, { processTime: { $size: 4 } }],
    });

    const ret = [];
    for (const order of orders) {
      const senderPostOfficeId = order.senderPostOfficeId;
      const recipientPostOfficeId = order.recipientPostOfficeId;
      const senderWarehouseId = await getWarehouseIDByPostOfficeID(
        senderPostOfficeId
      );
      const recipientWarehouseId = await getWarehouseIDByPostOfficeID(
        recipientPostOfficeId
      );
      if (senderWarehouseId === warehouseID && order.processTime.length === 2) {
        ret.push(order);
      }
      if (
        recipientWarehouseId === warehouseID &&
        order.processTime.length === 4
      ) {
        ret.push(order);
      }
    }

    res.json({ success: true, orders: ret });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// @route GET /warehouse/chart/all
// @desc Get all orders by month
// @access Public
router.get("/chart/all/:id", async (req, res) => {
  try {
    const warehouseId = parseInt(req.params.id, 10);
    const ordersByMonth = await Order.find();
    const ordersByMonthCount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (const order of ordersByMonth) {
      const month2 = order.processTime[2] !== undefined ? order.processTime[2].getMonth() : undefined;
      const month4 = order.processTime[4] !== undefined ? order.processTime[4].getMonth() : undefined;
      console.log(month2, month4);
      const senderWarehouseId = await getWarehouseIDByPostOfficeID(order.senderPostOfficeId);
      const recipientWarehouseId = await getWarehouseIDByPostOfficeID(order.recipientPostOfficeId);
      if (
        month2 !== undefined &&
        senderWarehouseId === warehouseId
      ) {
        ordersByMonthCount[month2]++;
      }
      if (
        month4 !== undefined &&
        recipientWarehouseId === warehouseId
      ) {
        ordersByMonthCount[month4]++;
      }
    }
    res.json({
      success: true,
      order: ordersByMonthCount
    });
    // Now, ordersByMonth contains an array of objects, each representing orders for a specific month in 2023
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// @route DELETE /warehouse/manager/:warehouseID
// @desc Delete a Warehouse Manager by warehouseID
// @access Public (or restricted based on your authentication logic)
router.delete("/manager/:warehouseID", async (req, res) => {
  try {
    const warehouseID = req.params.warehouseID;

    // Find and delete the Warehouse Manager based on the provided warehouseID
    const deletedWarehouseManager = await User.findOneAndDelete({
      role: "warehouseManager",
      warehouseID: warehouseID,
    });

    if (!deletedWarehouseManager) {
      return res.status(404).json({
        success: false,
        message: "Warehouse Manager not found for the specified warehouseID",
      });
    }

    res.json({
      success: true,
      message: "Warehouse Manager deleted successfully",
      deletedWarehouseManager,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
