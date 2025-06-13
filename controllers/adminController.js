const Car = require('../models/Car');
const Booking = require('../models/Booking');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../public/uploads/car-images');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for car image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, 'car-' + uniqueSuffix + extension);
    }
});

const fileFilter = (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Export multer instance for use in routes
exports.uploadCarImage = upload.single('carImage');

// Display admin dashboard
exports.getDashboard = async (req, res) => {
    try {
        const [bookings, cars] = await Promise.all([
            Booking.find()
                .populate('car')
                .populate('user')
                .populate({
                    path: 'paymentId',
                    model: 'Payment'
                })
                .sort({ createdAt: -1 }),
            Car.find().sort({ createdAt: -1 })
        ]);
        res.render('admin/dashboard', { 
            bookings, 
            cars,
            title: 'Admin Dashboard - Car Rental',
            currentPage: 'admin'
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).send('Error loading dashboard');
    }
};

// Display add car form
exports.getAddCar = (req, res) => {
    res.render('admin/add-car', {
        title: 'Add New Car - Car Rental',
        currentPage: 'admin',
        errors: null,
        formData: {},
        error: null
    });
};

// Process add car form
exports.postAddCar = async (req, res) => {
    try {
        console.log("📋 Received car data:", req.body);
        console.log("📸 Uploaded file:", req.file);

        // Check if image was uploaded
        if (!req.file) {
            throw new Error('Car image is required');
        }

        const requiredFields = ['brand', 'model', 'year', 'price', 'description'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            // Clean up uploaded file if validation fails
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        const features = req.body.features ? req.body.features.split(',').map(f => f.trim()) : [];
        
        // Use the uploaded file path
        const imagePath = `/uploads/car-images/${req.file.filename}`;
        
        const newCar = new Car({
            brand: req.body.brand,
            model: req.body.model,
            year: parseInt(req.body.year),
            price: parseFloat(req.body.price),
            image: imagePath,
            description: req.body.description,
            features: features,
            available: req.body.available === 'on',
            licenseNumber: req.body.licenseNumber || undefined
        });

        console.log("🚗 Attempting to save car:", newCar);

        const savedCar = await newCar.save();
        console.log("✅ Car saved successfully:", savedCar);

        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error("❌ Error adding car:", err);
        
        // Clean up uploaded file if car creation fails
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
                console.log("🗑️ Cleaned up uploaded file after error");
            } catch (unlinkError) {
                console.error("❌ Error cleaning up file:", unlinkError);
            }
        }
        
        res.status(500).render('admin/add-car', {
            title: 'Add New Car - Car Rental',
            currentPage: 'admin',
            error: err.message,
            errors: null,
            formData: req.body || {}
        });
    }
};

// Display edit car form
exports.getEditCar = async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) {
            return res.status(404).send('Car not found');
        }
        res.render('admin/edit-car', { 
            car,
            title: 'Edit Car - Car Rental',
            currentPage: 'admin',
            errors: null,
            formData: null,
            error: null
        });
    } catch (error) {
        console.error('Error fetching car:', error);
        res.status(500).send('Error loading car details');
    }
};

// Process edit car form
exports.postEditCar = async (req, res) => {
    try {
        console.log("📋 Updating car with data:", req.body);
        console.log("📸 New uploaded file:", req.file);

        const {
            brand,
            model,
            year,
            price,
            description,
            features,
            available
        } = req.body;

        // Convert features string to array
        const featuresArray = features ? features.split(',').map(feature => feature.trim()) : [];

        // Get the existing car to access current image
        const existingCar = await Car.findById(req.params.id);
        if (!existingCar) {
            // Clean up uploaded file if car not found
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(404).send('Car not found');
        }

        let imagePath = existingCar.image; // Keep existing image by default

        // If new image was uploaded, update the path and delete old image
        if (req.file) {
            imagePath = `/uploads/car-images/${req.file.filename}`;
            
            // Delete old image file if it exists and is not a URL
            if (existingCar.image && existingCar.image.startsWith('/uploads/')) {
                const oldImagePath = path.join(__dirname, '../public', existingCar.image);
                if (fs.existsSync(oldImagePath)) {
                    try {
                        fs.unlinkSync(oldImagePath);
                        console.log("🗑️ Deleted old car image:", existingCar.image);
                    } catch (deleteError) {
                        console.error("❌ Error deleting old image:", deleteError);
                    }
                }
            }
        }

        const car = await Car.findByIdAndUpdate(
            req.params.id,
            {
                brand,
                model,
                year,
                price,
                image: imagePath,
                description,
                features: featuresArray,
                available: available === 'true'
            },
            { new: true }
        );

        console.log("✅ Car updated successfully:", car);
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error('❌ Error updating car:', error);
        
        // Clean up uploaded file if update fails
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
                console.log("🗑️ Cleaned up uploaded file after error");
            } catch (unlinkError) {
                console.error("❌ Error cleaning up file:", unlinkError);
            }
        }
        
        res.status(500).send('Error updating car');
    }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const booking = await Booking.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.json({ success: true, booking });
    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({ error: 'Error updating booking status' });
    }
};

// Delete car
exports.deleteCar = async (req, res) => {
    try {
        const car = await Car.findByIdAndDelete(req.params.id);
        if (!car) {
            return res.status(404).json({ error: 'Car not found' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting car:', error);
        res.status(500).json({ error: 'Error deleting car' });
    }
};

// Toggle car availability
exports.toggleCarAvailability = async (req, res) => {
    try {
        const { available } = req.body;
        const car = await Car.findByIdAndUpdate(
            req.params.id,
            { available },
            { new: true }
        );
        if (!car) {
            return res.status(404).json({ error: 'Car not found' });
        }
        res.json({ success: true, car });
    } catch (error) {
        console.error('Error updating car availability:', error);
        res.status(500).json({ error: 'Error updating car availability' });
    }
};

// Delete booking
exports.deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ error: 'Error deleting booking' });
    }
}; 