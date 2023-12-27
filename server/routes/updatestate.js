const express = require("express");
const router = express.Router();
const Order = require("../models/Order.js");

// @route PUT updatestate/:id/:state
// @desc Update user
// @access Public
router.put("/:id/newNumState=:state", async (req, res) => {
  const orderID = req.params.id;
  const newState = parseInt(req.params.state);

  try {
    // Find the order by orderID
    const order = await Order.findOne({ orderID: orderID });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (newState >= 7) {
      return res.status(400).json({
        success: false,
        message: "Invalid new state number, state number must < 7",
      });
    }
    // Check if processTime array size is equal to newState
    if (order.processTime.length === newState) {
      // Add the current date to the processTime array
      const currentDate = new Date();
      order.processTime.push(
        new Date(currentDate.getTime() + 7 * 60 * 60 * 1000)
      );

      // Save the updated order
      await order.save();

      res.json({ success: true, updatedOrder: order });
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid state for updating processTime",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// @route PUT /updatestate/:id/sendToShip
// @desc send order to ship
// @access Public
router.put("/sendToShip/:id", async (req, res) => {
  const orderID = req.params.id;

  try {
    // Find the order by orderID
    const order = await Order.findOne({ orderID: orderID });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Check if processTime array size valid
    if (
      order.timeSuccess === null &&
      order.processTime.length > 6 &&
      (order.processTime.length - 7) % 2 === 0
    ) {
      // Add the current date to the processTime array
      const currentDate = new Date();
      order.processTime.push(
        new Date(currentDate.getTime() + 7 * 60 * 60 * 1000)
      );

      // Save the updated order
      await order.save();

      res.json({ success: true, updatedOrder: order });
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid state of order for sending to ship",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// @route PUT /updatestate/:id/shipFailed
// @desc ship order failed
// @access Public
router.put("/shipFailed/:id", async (req, res) => {
  const orderID = req.params.id;

  try {
    // Find the order by orderID
    const order = await Order.findOne({ orderID: orderID });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Check if processTime array size is equal to newState
    if (
      order.timeSuccess === null &&
      order.processTime.length > 7 &&
      (order.processTime.length - 7) % 2 === 1
    ) {
      // Add the current date to the processTime array
      const currentDate = new Date();
      order.processTime.push(
        new Date(currentDate.getTime() + 7 * 60 * 60 * 1000)
      );

      // Save the updated order
      await order.save();

      res.json({ success: true, updatedOrder: order });
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid state of order for set sended failed",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// @route PUT updatestate/:id/successfully
// @desc Successfully ship order
// @access Public
router.put("/successfully/:id", async (req, res) => {
  const orderID = req.params.id;

  try {
    // Find the order by orderID
    const order = await Order.findOne({ orderID: orderID });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    console.log(order.processTime.length);
    // Check if processTime array size is equal to newState
    if (
      order.timeSuccess === null &&
      order.processTime.length > 7 &&
      (order.processTime.length - 7) % 2 === 1
    ) {
      // Add the current date to the processTime array
      const currentDate = new Date();
      order.timeSuccess = new Date(currentDate.getTime() + 7 * 60 * 60 * 1000);

      // Save the updated order
      await order.save();

      res.json({ success: true, updatedOrder: order });
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid state for updating processTime",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
