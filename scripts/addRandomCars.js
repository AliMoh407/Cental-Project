const mongoose = require('mongoose');
const Car = require('../models/Car');
require('dotenv').config();

const carBrands = [
    'Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes-Benz',
    'Audi', 'Nissan', 'Hyundai', 'Kia', 'Volkswagen'
];

const carModels = {
    'Toyota': ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Prius'],
    'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey'],
    'Ford': ['F-150', 'Mustang', 'Explorer', 'Escape', 'Focus'],
    'BMW': ['3 Series', '5 Series', 'X3', 'X5', 'M3'],
    'Mercedes-Benz': ['C-Class', 'E-Class', 'GLC', 'GLE', 'S-Class'],
    'Audi': ['A4', 'A6', 'Q5', 'Q7', 'TT'],
    'Nissan': ['Altima', 'Maxima', 'Rogue', 'Murano', '370Z'],
    'Hyundai': ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Palisade'],
    'Kia': ['Forte', 'Optima', 'Sportage', 'Sorento', 'Telluride'],
    'Volkswagen': ['Jetta', 'Passat', 'Tiguan', 'Atlas', 'Golf']
};

const features = [
    'Air Conditioning', 'Bluetooth', 'Navigation System', 'Backup Camera',
    'Leather Seats', 'Sunroof', 'Cruise Control', 'Parking Sensors',
    'Keyless Entry', 'Heated Seats', 'Apple CarPlay', 'Android Auto',
    'Lane Departure Warning', 'Blind Spot Detection', 'Automatic Emergency Braking'
];

function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getRandomFeatures() {
    const numFeatures = Math.floor(Math.random() * 5) + 3; // 3-7 features
    const selectedFeatures = [];
    for (let i = 0; i < numFeatures; i++) {
        const feature = getRandomElement(features);
        if (!selectedFeatures.includes(feature)) {
            selectedFeatures.push(feature);
        }
    }
    return selectedFeatures;
}

function generateRandomCar() {
    const brand = getRandomElement(carBrands);
    const model = getRandomElement(carModels[brand]);
    const year = Math.floor(Math.random() * (2024 - 2018) + 2018); // 2018-2024
    const price = Math.floor(Math.random() * (2000 - 500) + 500); // 500-2000 L.E/day

    return {
        brand,
        model,
        year,
        price,
        description: `A well-maintained ${year} ${brand} ${model} with excellent features and performance.`,
        features: getRandomFeatures(),
        available: true,
        licenseNumber: `EG-${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 10000)}`,
        images: [] // Empty array for now, to be added through dashboard
    };
}

async function addRandomCars() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Clear existing cars (optional)
        // await Car.deleteMany({});
        // console.log('Cleared existing cars');

        // Generate and add 10 random cars
        const cars = Array.from({ length: 10 }, generateRandomCar);
        await Car.insertMany(cars);
        console.log('Successfully added 10 random cars to the database');

        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Run the script
addRandomCars(); 