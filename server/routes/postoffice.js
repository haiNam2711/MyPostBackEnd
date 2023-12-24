const express = require('express')
const router = express.Router()
const { v4: uuidv4 } = require('uuid');

const PostOffice = require('../models/PostOffice.js')
const User = require('../models/User.js')

async function getMaxPostOfficeID() {
    try {
        // Sử dụng phương thức findOne và sắp xếp giảm dần theo postOfficeID để lấy giá trị lớn nhất
        const maxPostOffice = await PostOffice.findOne({}).sort({ postOfficeID: -1 });

        if (maxPostOffice) {
            return maxPostOffice.postOfficeID;
        } else {
            return 100; // Trường hợp không có postOffice nào tồn tại, trả về 0 hoặc giá trị mặc định khác
        }
    } catch (error) {
        console.error(error);
        return 100; // Trong trường hợp lỗi, trả về 0 hoặc một giá trị mặc định
    }
}


// @route GET postoffice/all
// @desc Get all postoffice information
// @access Public
router.get('/all', async (req, res) => {
    try {
      const postOffices = await PostOffice.find();
      res.json({ success: true, postOffices });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// @route GET /postoffice/all/postofficeManagers/
// @desc Get all postoffice manager
// @access Public
router.get("/all/postofficeManagers", async (req, res) => {
    try {
      const officeManagers = await User.find({ role: "officeManager" });
  
      if (!officeManagers) {
        return res
          .status(404)
          .json({ success: false, message: "officeManagers not found" });
      }
      res.json({ success: true, officeManagers: officeManagers });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

// @route GET /postoffice/:postOfficeID
// @desc Get postoffice information by postofficeID
// @access Public 
router.get('/:postOfficeID', async (req, res) => {
  try {
      const postOfficeID = req.params.postOfficeID;
      console.log(postOfficeID);
      // Find the postOffice based on the provided postOfficeID
      const postOffice = await PostOffice.findOne({ postOfficeID });
      // const postOffice = await PostOffice.find();
      console.log(postOffice);

      if (!postOffice) {
          return res.status(404).json({
              success: false,
              message: 'postOffice not found for the specified postOfficeID',
          });
      }

      res.json({
          success: true,
          postOffice,
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
   
// @route GET postoffice/warehouseID=:warehouseID
// @desc Get all postoffice by warehouseID information
// @access Public
router.get('/byWarehouse/warehouseID=:warehouseID', async (req, res) => {
  try {
      const warehouseID = req.params.warehouseID; // Corrected parameter name

      // Ensure warehouseID is a valid number
      if (isNaN(warehouseID)) {
          return res.status(400).json({ success: false, message: 'Invalid warehouse ID' });
      }

      const postOffices = await PostOffice.find({ belongToWarehouseID: warehouseID });
      res.json({ success: true, postOffices });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// @route POST /postoffice/new
// @desc Create a new postoffice
// @access Public
router.post('/new/warehouseID=:warehouseID', async (req, res) => {
    try {
        const warehouseID = req.params.warehouseID;
        const { district } = req.body;
        // Simple validation
            if (!district || district === '')
            return res
                .status(400)
                .json({ success: false, message: 'Missing district' })
      
		const postoffice = await PostOffice.findOne({ district: district })
        if (postoffice)
			return res
				.status(400)
				.json({ success: false, message: 'district already taken' })

      const newpostoffice = new PostOffice({
        postOfficeID: await getMaxPostOfficeID() + 1,
        district,
        belongToWarehouseID: warehouseID,
      });
  
      await newpostoffice.save();
   
      res.json({ success: true, postoffice: newpostoffice });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
  
// @route DELETE /postoffice/:postOfficeID
// @desc Delete a post office by ID
// @access Public
router.delete('/:postOfficeID', async (req, res) => {
    try {
      const postOfficeID = req.params.postOfficeID;
  
      // Kiểm tra xem post office có tồn tại không
      const existingPostOffice = await PostOffice.findOne({ postOfficeID });
  
      if (!existingPostOffice) {
        return res.status(404).json({ success: false, message: 'Post Office not found' });
      }
  
      // Xoá post office
      await existingPostOffice.deleteOne({ postOfficeID })
  
      res.json({ success: true, message: 'Post Office deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });
  

// @route GET /postoffice/manager/:postOfficeID
// @desc Get postoffice manager
// @access Public
router.get('/manager/:postOfficeID', async (req, res) => {
  try {
      const postOfficeID = req.params.postOfficeID;
  
      // Tìm người dùng có role là 'postOfficeManager' và postOfficeID phù hợp
      const postOfficeManager = await User.findOne({ role: 'officeManager', postOfficeID });
  
      if (!postOfficeManager) {
          return res.status(404).json({ success: false, message: 'postOfficeManager not found for the specified postOffice' });
      }
      res.json({ success: true, postOfficeManager });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// @route GET /postoffice/all/notHavePostOfficeManagers/
// @desc Get all warehouse manager
// @access Public
router.get("/all/notHavePostOfficeManagers", async (req, res) => {
  try {
    const postOfficesWithoutManager = await PostOffice.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'postOfficeID',
          foreignField: 'postOfficeID',
          as: 'postOfficeUsers',
        },
      },
      {
        $match: {
          postOfficeUsers: { $not: { $elemMatch: { role: 'officeManager' } } },
        },
      },
      {
        $project: {
          _id: 0, // Exclude _id field from the result
          postOfficeID: 1,
          district: 1,
          belongToWarehouseID: 1,
        },
      },
    ]);

    res.json({ success: true, postOfficesWithoutManager });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// @route DELETE /postoffice/manager/:postOfficeID
// @desc Delete a postoffice Manager by postOfficeID
// @access Public 
router.delete('/manager/:postOfficeID', async (req, res) => {
  try {
      const postOfficeID = req.params.postOfficeID;

      // Find and delete the postoffice Manager based on the provided postofficeID
      const deletedPostOfficeManager = await User.findOneAndDelete({
          role: 'officeManager',
          postOfficeID
      });

      if (!deletedPostOfficeManager) {
          return res.status(404).json({
              success: false,
              message: 'officeManager not found for the specified officeManagerID',
          });
      }

      res.json({
          success: true,
          message: 'officeManager deleted successfully',
          deletedPostOfficeManager,
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
   
