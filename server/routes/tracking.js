const express = require('express')
const router = express.Router()

const Order = require('../models/Order.js')
const PostOffice = require('../models/PostOffice.js')

async function getOrderCount() {
  try {
      // Sử dụng phương thức countDocuments với Promises
      const count = await Order.countDocuments({});
      return count; // Trả về số lượng documents để sử dụng trong code khác nếu cần
  } catch (error) {
      console.error(error);
      return 0; // Trong trường hợp lỗi, trả về 0 hoặc một giá trị mặc định
  }
}

async function getWarehouseIDByPostOfficeID(postOfficeID) {
  try {
    const postOffice = await PostOffice.findOne({ postOfficeID });
    if (!postOffice) {
        return -1
    }
    return postOffice.belongToWarehouseID;
  } catch (error) {
    console.error(error);
    return -1; // Trong trường hợp lỗi, trả về 0 hoặc một giá trị mặc định
  }
}

// @route GET orders/id=:orderID
// @desc Get a order information
// @access Public
router.get('/id=:orderID', async (req, res) => {
    try {
      const orderID = req.params.orderID;
  
      // Kiểm tra xem orderId có đúng định dạng ObjectId không
      if (!orderID.match(/^[0-9a-fA-F]{6}$/)) {
        return res.status(400).json({ success: false, message: 'Invalid order ID format, ID must have 6 chars in alphabet and digit.' });
      }
  
      // Sử dụng tên trường chính xác là "orderId" trong câu truy vấn
      const order = await Order.findOne({ orderID: orderID });
  
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
  
      res.json({ success: true, order });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// @route GET orders/all
// @desc Get all order information
// @access Public
router.get('/all', async (req, res) => {
  try {
    const orders = await Order.find();

    if (!orders) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// @route GET orders/succesfullyByPostOffice/:postOfficeID
// @desc Get all order information
// @access Public
router.get('/succesfullyByPostOffice/:postOfficeID', async (req, res) => {
  try {
    const postOfficeID = parseInt(req.params.postOfficeID, 10);
    const orders = await Order.find();

    if (!orders) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    var returnOrders = [];
    for (const order of orders) {
      if (order.timeSuccess !== null && order.recipientPostOfficeId === postOfficeID) {
        returnOrders.push(order);
      }
    }
    res.json({ success: true, successfulOrders: returnOrders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// @route GET orders/notSuccesfullyByPostOffice/:postOfficeID
// @desc Get all order information
// @access Public
router.get('/notSuccesfullyByPostOffice/:postOfficeID', async (req, res) => {
  try {
    const postOfficeID = parseInt(req.params.postOfficeID, 10);
    const orders = await Order.find();

    if (!orders) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    var returnOrders = [];
    for (const order of orders) {
      if (order.timeSuccess === null && order.recipientPostOfficeId === postOfficeID && order.processTime.length > 7) {
        returnOrders.push(order);
      }
    }
    res.json({ success: true, notSuccessfulOrders: returnOrders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// @route GET /orders/byPostOffice/:postOfficeID
// @desc Get orders based on postOfficeID and processTime conditions
// @access Public (or restricted based on your authentication logic)
router.get('/byPostOffice/:postOfficeID', async (req, res) => {
  try {
      const postOfficeID = parseInt(req.params.postOfficeID, 10);

      const isInsideOfficeOrders = await Order.find({
          $or: [
              { $and: [{ processTime: { $exists: true, $ne: [] } }, { processTime: { $size: 1 } }, { senderPostOfficeId: postOfficeID }] },
              { $and: [{ processTime: { $exists: true, $ne: [] } }, { processTime: { $size: 7 } }, { recipientPostOfficeId: postOfficeID }] }
          ]
      });

      const isSendedOutOfficeOrders = await Order.find({
        $or: [
            { $and: [{ processTime: { $exists: true, $ne: [] } }, { processTime: { $size: 2 } }, { senderPostOfficeId: postOfficeID }] },
            { $and: [{ processTime: { $exists: true, $ne: [] } }, { processTime: { $size: 8 } }, { recipientPostOfficeId: postOfficeID }] }
        ]
      });
      console.log(isSendedOutOfficeOrders)

      if (!isInsideOfficeOrders || !isSendedOutOfficeOrders) {
          return res.status(404).json({
              success: false,
              message: 'Orders not found for the specified postOfficeID',
          });
      }

      res.json({
          success: true,
          inside: isInsideOfficeOrders,
          sended: isSendedOutOfficeOrders
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// @route GET /orders/byWarehouse/:warehouseID
// @desc Get orders based on warehouseID and processTime conditions
// @access Public 
router.get('/byWarehouse/:warehouseID', async (req, res) => {
  try {
      const warehouseID = parseInt(req.params.warehouseID, 10);

      var isInsideSenderWarehouse = await Order.find({
        $and: [{ processTime: { $exists: true, $ne: [] } }, { processTime: { $size: 3 } }] 
      });
      const returnisInsideSenderWarehouse = [];
      for (const order of isInsideSenderWarehouse) {
        const tmp = await getWarehouseIDByPostOfficeID(order.senderPostOfficeId);
        if (tmp === warehouseID) {
          returnisInsideSenderWarehouse.push(order);
        }
      }

      var isInsideRecipientWarehouse = await Order.find({
        $and: [{ processTime: { $exists: true, $ne: [] } }, { processTime: { $size: 5 } }] 
      });
      const returnisInsideRecipientWarehouse = [];
      for (const order of isInsideRecipientWarehouse) {
        const tmp = await getWarehouseIDByPostOfficeID(order.recipientPostOfficeId);
        if (tmp === warehouseID) {
          returnisInsideRecipientWarehouse.push(order);
        }
      }

      var isSendedSenderWarehouse = await Order.find({
        $and: [{ processTime: { $exists: true, $ne: [] } }, { processTime: { $size: 4 } }] 
      });
      const returnIsSendedSenderWarehouse = [];
      for (const order of isSendedSenderWarehouse) {
        const tmp = await getWarehouseIDByPostOfficeID(order.senderPostOfficeId);
        if (tmp === warehouseID) {
          returnIsSendedSenderWarehouse.push(order);
        }
      }

      var isSendedRecipientWarehouse = await Order.find({
        $and: [{ processTime: { $exists: true, $ne: [] } }, { processTime: { $size: 6 } }] 
      });
      const returnisSendedRecipientWarehouse = [];
      for (const order of isSendedRecipientWarehouse) {
        const tmp = await getWarehouseIDByPostOfficeID(order.recipientPostOfficeId);
        if (tmp === warehouseID) {
          returnisSendedRecipientWarehouse.push(order);
        }
      }


      if (!isInsideSenderWarehouse || !isSendedSenderWarehouse) {
          return res.status(404).json({
              success: false,
              message: 'Orders not found for the specified warehouseID',
          });
      }

      res.json({
          success: true,
          inside: returnisInsideSenderWarehouse.concat(returnisInsideRecipientWarehouse),
          sended: returnIsSendedSenderWarehouse.concat(returnisSendedRecipientWarehouse)
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


// @route POST /orders/new
// @desc Create a new order
// @access Public
router.post('/new', async (req, res) => {
  try {
    const {
      senderName,
      senderPhone,
      recipientName,
      recipientPhone,
      senderPostOfficeId,
      recipientPostOfficeId,
      deliveryEmployeeId,
    } = req.body;

    const currentDate = new Date();
    const newOrder = new Order({
      orderID: await getOrderCount() + 1 + 100000,
      senderName,
      senderPhone,
      recipientName,
      recipientPhone,
      senderPostOfficeId,
      recipientPostOfficeId,
      processTime: [new Date(currentDate.getTime() + 7 * 60 * 60 * 1000)],
      timeSuccess: null,
      deliveryEmployeeId: deliveryEmployeeId || null,
      createdAt: new Date(),
    });

    await newOrder.save();

    res.json({ success: true, order: newOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;

  