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
exports.uploadCarImages = upload.array('images', 5); // Allow up to 5 images

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

        // Log car data for debugging
        console.log('Cars data:', cars.map(car => ({
            id: car._id,
            brand: car.brand,
            model: car.model,
            images: car.images
        })));

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
        console.log("📸 Uploaded files:", req.files);

        // Check if images were uploaded
        if (!req.files || req.files.length === 0) {
            throw new Error('At least one car image is required');
        }

        const requiredFields = ['brand', 'model', 'year', 'price', 'description'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            // Clean up uploaded files if validation fails
            if (req.files) {
                req.files.forEach(file => fs.unlinkSync(file.path));
            }
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        const features = req.body.features ? req.body.features.split(',').map(f => f.trim()) : [];
        
        // Use the uploaded file paths
        const imagePaths = req.files.map(file => `/uploads/car-images/${file.filename}`);
        
        const newCar = new Car({
            brand: req.body.brand,
            model: req.body.model,
            year: parseInt(req.body.year),
            price: parseFloat(req.body.price),
            images: imagePaths,
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
        
        // Clean up uploaded files if car creation fails
        if (req.files) {
            req.files.forEach(file => {
                try {
                    fs.unlinkSync(file.path);
                    console.log("🗑️ Cleaned up uploaded file after error");
                } catch (unlinkError) {
                    console.error("❌ Error cleaning up file:", unlinkError);
                }
            });
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
        console.log("📸 New uploaded files:", req.files);

        const {
            brand,
            model,
            year,
            price,
            description,
            features,
            available,
            deletedImages
        } = req.body;

        // Convert features string to array
        const featuresArray = features ? features.split(',').map(feature => feature.trim()) : [];

        // Get the existing car to access current images
        const existingCar = await Car.findById(req.params.id);
        if (!existingCar) {
            // Clean up uploaded files if car not found
            if (req.files) {
                req.files.forEach(file => fs.unlinkSync(file.path));
            }
            return res.status(404).send('Car not found');
        }

        // Handle deleted images
        let updatedImages = [...existingCar.images];
        if (deletedImages) {
            try {
                const deletedImagesArray = JSON.parse(deletedImages);
                deletedImagesArray.forEach(({ path }) => {
                    // Remove from images array
                    updatedImages = updatedImages.filter(img => img !== path);
                    
                    // Delete the file from the server
                    const fullPath = path.join(__dirname, '../public', path);
                    if (fs.existsSync(fullPath)) {
                        fs.unlinkSync(fullPath);
                        console.log("🗑️ Deleted image file:", path);
                    }
                });
            } catch (error) {
                console.error("Error processing deleted images:", error);
            }
        }

        // Prepare update data
        const updateData = {
            brand,
            model,
            year: parseInt(year),
            price: parseFloat(price),
            description,
            features: featuresArray,
            available: available === 'on',
            licenseNumber: req.body.licenseNumber || undefined,
            images: updatedImages
        };

        // If new images were uploaded, add them to the existing images
        if (req.files && req.files.length > 0) {
            const newImagePaths = req.files.map(file => `/uploads/car-images/${file.filename}`);
            updateData.images = [...updateData.images, ...newImagePaths];
        }

        // Update the car
        const updatedCar = await Car.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        console.log("✅ Car updated successfully:", updatedCar);
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error("❌ Error updating car:", error);
        
        // Clean up uploaded files if update fails
        if (req.files) {
            req.files.forEach(file => {
                try {
                    fs.unlinkSync(file.path);
                } catch (unlinkError) {
                    console.error("❌ Error cleaning up file:", unlinkError);
                }
            });
        }
        
        res.status(500).render('admin/edit-car', {
            title: 'Edit Car - Car Rental',
            currentPage: 'admin',
            error: error.message,
            errors: null,
            formData: req.body,
            car: await Car.findById(req.params.id)
        });
    }
};

// Delete a car
exports.deleteCar = async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }

        // Delete associated images
        if (car.images && car.images.length > 0) {
            car.images.forEach(imagePath => {
                const fullPath = path.join(__dirname, '../public', imagePath);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            });
        }

        await Car.findByIdAndDelete(req.params.id);
        res.json({ message: 'Car deleted successfully' });
    } catch (error) {
        console.error('Error deleting car:', error);
        res.status(500).json({ message: 'Error deleting car' });
    }
};

// Toggle car availability
exports.toggleCarAvailability = async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }

        car.available = !car.available;
        await car.save();
        res.json({ message: 'Car availability updated', available: car.available });
    } catch (error) {
        console.error('Error toggling car availability:', error);
        res.status(500).json({ message: 'Error updating car availability' });
    }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        booking.status = status;
        await booking.save();
        res.json({ message: 'Booking status updated', status: booking.status });
    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({ message: 'Error updating booking status' });
    }
};

// Delete booking
exports.deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        await Booking.findByIdAndDelete(req.params.id);
        res.json({ message: 'Booking deleted successfully' });
    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ message: 'Error deleting booking' });
    }
}; 