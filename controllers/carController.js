const Car = require('../models/Car');
const Booking = require('../models/Booking');

// Display homepage with cars
exports.getHomepage = async (req, res) => {
  try {
    const cars = await Car.find();
    res.render('homepage', {
      title: 'Cental - Your Journey Starts Here',
      currentPage: 'home',
      cars: cars
    });
  } catch (err) {
    console.error("Error fetching cars:", err);
    res.status(500).send("Error loading homepage");
  }
};

// Display car details
exports.getCarDetails = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).send("Car not found");
    }
    res.render('car-details', {
      title: `${car.brand} ${car.model} - Cental`,
      currentPage: 'cars',
      car: car
    });
  } catch (err) {
    console.error("Error fetching car details:", err);
    res.status(500).send("Error loading car details");
  }
};

// Display all cars
exports.getAllCars = async (req, res) => {
  try {
    const cars = await Car.find();
    res.render('cars', {
      title: 'Our Fleet',
      currentPage: 'cars',
      cars: cars
    });
  } catch (err) {
    console.error("Error fetching cars:", err);
    res.status(500).send("Error loading cars");
  }
};

// API: Search cars
exports.searchCars = async (req, res) => {
  try {
    const { q } = req.query;
    const searchRegex = new RegExp(q, 'i'); // Case-insensitive search
    
    const cars = await Car.find({
      $or: [
        { brand: searchRegex },
        { model: searchRegex },
        { description: searchRegex }
      ]
    });
    
    res.json(cars);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
};

// API: Filter cars
exports.filterCars = async (req, res) => {
  try {
    const { brand, minPrice, maxPrice, year, available } = req.query;
    
    const filter = {};
    
    if (brand && brand !== '') filter.brand = new RegExp(brand, 'i');
    if (minPrice) filter.price = { ...filter.price, $gte: parseFloat(minPrice) };
    if (maxPrice) filter.price = { ...filter.price, $lte: parseFloat(maxPrice) };
    if (year) filter.year = parseInt(year);
    if (available) filter.available = available === 'true';
    
    const cars = await Car.find(filter);
    res.json(cars);
  } catch (error) {
    console.error('Filter error:', error);
    res.status(500).json({ error: 'Filter failed' });
  }
};

// API: Get single car
exports.getCarById = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    res.json(car);
  } catch (error) {
    console.error('Error fetching car:', error);
    res.status(500).json({ error: 'Failed to fetch car' });
  }
};

// API: Check car availability
exports.checkCarAvailability = async (req, res) => {
  try {
    const { carId, pickupDate, returnDate } = req.body;
    
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    
    if (!car.available) {
      return res.json({ 
        available: false, 
        message: 'This car is currently not available' 
      });
    }
    
    // Check for conflicting bookings
    const conflictingBooking = await Booking.findOne({
      car: carId,
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        {
          pickupDate: { $lte: new Date(returnDate) },
          returnDate: { $gte: new Date(pickupDate) }
        }
      ]
    });
    
    if (conflictingBooking) {
      return res.json({ 
        available: false, 
        message: 'Car is not available for selected dates' 
      });
    }
    
    res.json({ 
      available: true, 
      message: 'Car is available for your selected dates!' 
    });
    
  } catch (error) {
    console.error('Availability check error:', error);
    res.status(500).json({ error: 'Availability check failed' });
  }
}; 