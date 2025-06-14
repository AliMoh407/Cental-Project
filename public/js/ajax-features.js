// AJAX/Fetch Features for Car Rental Website

// Enhanced Animation Controller
class AnimationController {
    constructor() {
        this.observers = new Map();
        this.initScrollAnimations();
        this.initHoverEffects();
        this.initLoadingAnimations();
    }

    initScrollAnimations() {
        // Intersection Observer for scroll-based animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const delay = entry.target.dataset.delay || 0;
                    setTimeout(() => {
                        entry.target.classList.add('animate');
                        this.triggerCounterAnimation(entry.target);
                    }, delay);
                }
            });
        }, observerOptions);

        // Observe all animated elements
        document.querySelectorAll('.fade-in-up, .slide-in-left, .slide-in-right, .slide-in-up, .scale-in').forEach(el => {
            observer.observe(el);
        });

        this.observers.set('scroll', observer);
    }

    initHoverEffects() {
        // Enhanced hover effects for cards
        const cards = document.querySelectorAll('.car-card, .feature-card, .stat-item');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-10px) scale(1.02)';
                card.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
                card.style.boxShadow = '';
            });
        });

        // Button animations
        const buttons = document.querySelectorAll('.btn, .btn-primary, .btn-secondary');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'translateY(-2px)';
                btn.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translateY(0)';
                btn.style.boxShadow = '';
            });
        });
    }

    initLoadingAnimations() {
        // Page load animations
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                document.body.classList.add('loaded');
                this.animateHeader();
                this.animateHeroSection();
            }, 100);
        });
    }

    animateHeader() {
        const header = document.querySelector('.main-header');
        if (header) {
            header.style.opacity = '0';
            header.style.transform = 'translateY(-100%)';
            setTimeout(() => {
                header.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                header.style.opacity = '1';
                header.style.transform = 'translateY(0)';
            }, 200);
        }
    }

    animateHeroSection() {
        const heroElements = document.querySelectorAll('.hero-content > *');
        heroElements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(50px)';
            setTimeout(() => {
                el.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, 300 + (index * 150));
        });
    }

    triggerCounterAnimation(element) {
        if (element.classList.contains('stat-item') && !element.dataset.animated) {
            const numberEl = element.querySelector('.stat-number');
            if (numberEl && numberEl.dataset.target) {
                this.animateCounter(numberEl, parseInt(numberEl.dataset.target));
                element.dataset.animated = 'true';
            }
        }
    }

    animateCounter(element, target) {
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target.toLocaleString();
                clearInterval(timer);
            } else {
                element.textContent = Math.ceil(current).toLocaleString();
            }
        }, 16);
    }

    // Smooth scrolling for anchor links
    initSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Parallax effect for hero sections
    initParallaxEffects() {
        const parallaxElements = document.querySelectorAll('.hero, .page-hero');
        
        window.addEventListener('scroll', () => {
            const scrollY = window.pageYOffset;
            
            parallaxElements.forEach(el => {
                const speed = 0.5;
                el.style.transform = `translateY(${scrollY * speed}px)`;
            });
        });
    }
}

// 1. Real-time Car Search and Filtering
class CarSearch {
    constructor() {
        this.searchInput = document.getElementById('car-search');
        this.filterForm = document.getElementById('filter-form');
        this.carsContainer = document.getElementById('cars-container');
        this.loadingIndicator = document.getElementById('loading');
        this.paginationContainer = document.querySelector('.pagination');
        this.currentPage = 1;
        this.currentLimit = 6;
        this.currentQuery = '';
        this.currentFilters = {};
        
        this.initEventListeners();
    }

    initEventListeners() {
        // Real-time search with debouncing
        if (this.searchInput) {
            let debounceTimer;
            this.searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.currentPage = 1; // Reset to first page on new search
                    this.currentQuery = e.target.value;
                    this.searchCars(this.currentQuery);
                }, 300);
            });
        }

        // Filter form submission
        if (this.filterForm) {
            this.filterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.currentPage = 1; // Reset to first page on new filter
                this.filterCars();
            });
        }

        // Handle pagination click events
        document.addEventListener('click', (e) => {
            if (e.target.closest('.pagination-page') || e.target.closest('.pagination-btn')) {
                e.preventDefault();
                const pageLink = e.target.closest('.pagination-page') || e.target.closest('.pagination-btn');
                const href = pageLink.getAttribute('href');
                const pageParam = new URLSearchParams(href.split('?')[1]).get('page');
                
                if (pageParam) {
                    this.currentPage = parseInt(pageParam);
                    
                    if (Object.keys(this.currentFilters).length > 0) {
                        this.filterCars();
                    } else if (this.currentQuery) {
                        this.searchCars(this.currentQuery);
                    } else {
                        window.location.href = href; // Use regular navigation if no active search/filter
                    }
                }
            }
        });
    }

    async searchCars(query) {
        try {
            this.showLoading();
            
            const response = await fetch(`/api/cars/search?q=${encodeURIComponent(query)}&page=${this.currentPage}&limit=${this.currentLimit}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.displayCars(data.cars);
            this.updatePagination(data.pagination);
            
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Failed to search cars. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    async filterCars() {
        try {
            this.showLoading();
            
            const formData = new FormData(this.filterForm);
            this.currentFilters = Object.fromEntries(formData.entries());
            
            // Add pagination parameters
            this.currentFilters.page = this.currentPage;
            this.currentFilters.limit = this.currentLimit;
            
            const queryString = new URLSearchParams(this.currentFilters).toString();
            
            const response = await fetch(`/api/cars/filter?${queryString}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.displayCars(data.cars);
            this.updatePagination(data.pagination);
            
        } catch (error) {
            console.error('Filter error:', error);
            this.showError('Failed to filter cars. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    displayCars(cars) {
        if (!this.carsContainer) return;
        
        if (cars.length === 0) {
            this.carsContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <p>No cars found matching your criteria.</p>
                    <button class="btn btn-secondary" onclick="window.location.reload()">
                        Reset Search
                    </button>
                </div>
            `;
            if (this.paginationContainer) {
                this.paginationContainer.style.display = 'none';
            }
            return;
        }
        
        let html = '';
        
        cars.forEach(car => {
            html += `
                <div class="car-card" data-car-id="${car._id}">
                    <div class="car-image-container">
                        ${car.images && car.images.length > 0 ? 
                            `<img src="${car.images[0].startsWith('/') ? car.images[0] : '/' + car.images[0]}" 
                                  alt="${car.brand} ${car.model}" 
                                  loading="lazy">` :
                            `<div class="no-image">
                                <i class="fas fa-car"></i>
                                <p>No Image Available</p>
                            </div>`
                        }
                    </div>
                    <div class="car-info">
                        <h3>${car.brand} ${car.model}</h3>
                        <p class="year">${car.year}</p>
                        <p class="price">L.E ${car.price}/day</p>
                        <div class="availability ${car.available ? 'available' : 'unavailable'}">
                            ${car.available ? 'Available' : 'Not Available'}
                        </div>
                        <button class="btn btn-primary" onclick="viewCarDetails('${car._id}')">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                    </div>
                </div>
            `;
        });
        
        this.carsContainer.innerHTML = html;
    }

    updatePagination(pagination) {
        if (!this.paginationContainer || !pagination) return;
        
        if (pagination.totalPages <= 1) {
            this.paginationContainer.style.display = 'none';
            return;
        }
        
        this.paginationContainer.style.display = 'flex';
        
        const paginationInfo = this.paginationContainer.querySelector('.pagination-info');
        if (paginationInfo) {
            paginationInfo.textContent = `Showing ${(pagination.page - 1) * pagination.limit + 1} to ${Math.min(pagination.page * pagination.limit, pagination.totalCars)} of ${pagination.totalCars} cars`;
        }
        
        const paginationControls = this.paginationContainer.querySelector('.pagination-controls');
        if (!paginationControls) return;
        
        let html = '';
        
        // Previous button
        if (pagination.hasPrevPage) {
            html += `
                <a href="/?page=${pagination.prevPage}" class="pagination-btn">
                    <i class="fas fa-chevron-left"></i> Previous
                </a>
            `;
        }
        
        // Page numbers
        html += '<div class="pagination-pages">';
        
        let startPage = Math.max(1, pagination.page - 2);
        let endPage = Math.min(pagination.totalPages, pagination.page + 2);
        
        if (startPage > 1) {
            html += `
                <a href="/?page=1" class="pagination-page ${pagination.page === 1 ? 'active' : ''}">1</a>
            `;
            if (startPage > 2) {
                html += '<span class="pagination-ellipsis">...</span>';
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            html += `
                <a href="/?page=${i}" class="pagination-page ${pagination.page === i ? 'active' : ''}">
                    ${i}
                </a>
            `;
        }
        
        if (endPage < pagination.totalPages) {
            if (endPage < pagination.totalPages - 1) {
                html += '<span class="pagination-ellipsis">...</span>';
            }
            html += `
                <a href="/?page=${pagination.totalPages}" class="pagination-page ${pagination.page === pagination.totalPages ? 'active' : ''}">
                    ${pagination.totalPages}
                </a>
            `;
        }
        
        html += '</div>';
        
        // Next button
        if (pagination.hasNextPage) {
            html += `
                <a href="/?page=${pagination.nextPage}" class="pagination-btn">
                    Next <i class="fas fa-chevron-right"></i>
                </a>
            `;
        }
        
        paginationControls.innerHTML = html;
    }

    showLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = 'flex';
        }
    }
    
    hideLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = 'none';
        }
    }
    
    showError(message) {
        // Display error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'search-error';
        errorDiv.innerHTML = `
            <div class="error-content">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
                <button class="close-error">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
        
        // Close button
        errorDiv.querySelector('.close-error').addEventListener('click', () => {
            errorDiv.remove();
        });
    }
}

// 2. Real-time Booking System
class BookingManager {
    constructor() {
        this.bookingForm = document.getElementById('booking-form');
        this.initEventListeners();
    }

    initEventListeners() {
        if (this.bookingForm) {
            this.bookingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (this.validateForm()) {
                    this.submitBooking();
                }
            });
        }

        // Real-time availability check when dates change
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.validateDateField(input);
                this.checkAvailability();
            });
        });

        // Real-time field validation
        const locationInput = document.getElementById('pickup-location');
        if (locationInput) {
            locationInput.addEventListener('blur', () => this.validateLocationField());
        }
    }

    validateForm() {
        let isValid = true;
        
        // Clear previous errors
        this.clearAllErrors();
        
        // Validate pickup date
        if (!this.validatePickupDate()) isValid = false;
        
        // Validate return date
        if (!this.validateReturnDate()) isValid = false;
        
        // Validate location
        if (!this.validateLocationField()) isValid = false;
        
        return isValid;
    }

    validatePickupDate() {
        const pickupDate = document.getElementById('pickup-date');
        const pickupValue = pickupDate.value;
        
        if (!pickupValue) {
            this.showFieldError('pickup-date', 'Pickup date is required');
            return false;
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const pickup = new Date(pickupValue);
        
        if (pickup < today) {
            this.showFieldError('pickup-date', 'Pickup date cannot be in the past');
            return false;
        }
        
        this.clearFieldError('pickup-date');
        return true;
    }

    validateReturnDate() {
        const pickupDate = document.getElementById('pickup-date');
        const returnDate = document.getElementById('return-date');
        const pickupValue = pickupDate.value;
        const returnValue = returnDate.value;
        
        if (!returnValue) {
            this.showFieldError('return-date', 'Return date is required');
            return false;
        }
        
        if (pickupValue && returnValue) {
            const pickup = new Date(pickupValue);
            const return_ = new Date(returnValue);
            
            if (return_ <= pickup) {
                this.showFieldError('return-date', 'Return date must be after pickup date');
                return false;
            }
            
            // Check max rental period (30 days)
            const maxRental = new Date(pickup);
            maxRental.setDate(maxRental.getDate() + 30);
            
            if (return_ > maxRental) {
                this.showFieldError('return-date', 'Maximum rental period is 30 days');
                return false;
            }
        }
        
        this.clearFieldError('return-date');
        return true;
    }

    validateLocationField() {
        const locationInput = document.getElementById('pickup-location');
        const location = locationInput.value.trim();
        
        if (!location) {
            this.showFieldError('pickup-location', 'Please select a pickup location');
            return false;
        }
        
        this.clearFieldError('pickup-location');
        return true;
    }

    validateDateField(input) {
        if (input.id === 'pickup-date') {
            this.validatePickupDate();
        } else if (input.id === 'return-date') {
            this.validateReturnDate();
        }
    }

    showFieldError(fieldName, message) {
        const errorElement = document.querySelector(`.${fieldName}-error`);
        const inputElement = document.getElementById(fieldName);
        
        if (errorElement) {
            errorElement.style.display = 'flex';
            errorElement.querySelector('span').textContent = message;
        }
        
        if (inputElement) {
            inputElement.classList.add('input-error');
        }
    }

    clearFieldError(fieldName) {
        const errorElement = document.querySelector(`.${fieldName}-error`);
        const inputElement = document.getElementById(fieldName);
        
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        
        if (inputElement) {
            inputElement.classList.remove('input-error');
        }
    }

    clearAllErrors() {
        const errorElements = document.querySelectorAll('.field-error');
        errorElements.forEach(element => {
            element.style.display = 'none';
        });
        
        const inputElements = document.querySelectorAll('.input-error');
        inputElements.forEach(element => {
            element.classList.remove('input-error');
        });
    }

    async submitBooking() {
        try {
            const formData = new FormData(this.bookingForm);
            const bookingData = Object.fromEntries(formData.entries());

            const response = await fetch('/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bookingData)
            });

            const result = await response.json();

            if (!response.ok) {
                if (result.errors) {
                    // Display field-specific errors
                    Object.keys(result.errors).forEach(field => {
                        this.showFieldError(field, result.errors[field]);
                    });
                } else {
                    this.showErrorMessage(result.error || 'Failed to add to cart');
                }
                return;
            }

            this.showSuccessMessage('Car added to cart successfully!');
            this.bookingForm.reset();
            this.clearAllErrors();
            
            // Update cart count in header
            this.updateCartCount(result.cartItemsCount);
            
            // Show option to go to cart
            setTimeout(() => {
                if (confirm('Car added to cart! Would you like to view your cart?')) {
                    window.location.href = '/cart';
                }
            }, 1000);
            
        } catch (error) {
            console.error('Add to cart error:', error);
            this.showErrorMessage('An error occurred while adding to cart');
        }
    }

    updateCartCount(count) {
        // Update cart count in header if element exists
        const cartCountElement = document.querySelector('.cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = count;
            cartCountElement.style.display = count > 0 ? 'inline' : 'none';
        }
    }

    async checkAvailability() {
        const carId = document.getElementById('car-id')?.value;
        const pickupDate = document.getElementById('pickup-date')?.value;
        const returnDate = document.getElementById('return-date')?.value;

        if (!carId || !pickupDate || !returnDate) return;

        try {
            const response = await fetch('/api/cars/availability', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    carId,
                    pickupDate,
                    returnDate
                })
            });

            const result = await response.json();
            this.updateAvailabilityDisplay(result.available, result.message);

        } catch (error) {
            console.error('Availability check error:', error);
        }
    }

    updateAvailabilityDisplay(available, message) {
        let availabilityDiv = document.getElementById('availability-status');
        if (!availabilityDiv) {
            availabilityDiv = document.createElement('div');
            availabilityDiv.id = 'availability-status';
            availabilityDiv.style.cssText = `
                margin: 10px 0;
                padding: 10px;
                border-radius: 5px;
                font-weight: bold;
            `;
            this.bookingForm.appendChild(availabilityDiv);
        }

        availabilityDiv.className = `availability-status ${available ? 'available' : 'unavailable'}`;
        availabilityDiv.style.backgroundColor = available ? '#d4edda' : '#f8d7da';
        availabilityDiv.style.color = available ? '#155724' : '#721c24';
        availabilityDiv.innerHTML = `
            <i class="fas ${available ? 'fa-check-circle' : 'fa-times-circle'}"></i>
            ${message}
        `;
    }

    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px;
            border-radius: 5px;
            z-index: 1000;
            color: white;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
        `;
        messageDiv.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check' : 'fa-exclamation-triangle'}"></i>
            ${message}
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
}

// 3. Contact Form with AJAX
class ContactForm {
    constructor() {
        this.contactForm = document.getElementById('contact-form');
        this.initEventListeners();
    }

    initEventListeners() {
        if (this.contactForm) {
            this.contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitContact();
            });
        }
    }

    async submitContact() {
        try {
            const formData = new FormData(this.contactForm);
            const contactData = Object.fromEntries(formData.entries());

            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contactData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Message sending failed');
            }

            this.showSuccessMessage('Thank you! Your message has been sent successfully.');
            this.contactForm.reset();

        } catch (error) {
            console.error('Contact form error:', error);
            this.showErrorMessage(error.message);
        }
    }

    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `contact-message ${type}`;
        messageDiv.style.cssText = `
            margin: 10px 0;
            padding: 10px;
            border-radius: 5px;
            color: white;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
        `;
        messageDiv.textContent = message;
        
        this.contactForm.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
}

// 4. Utility Functions
function viewCarDetails(carId) {
    window.location.href = `/car/${carId}`;
}

async function loadCarData(carId) {
    try {
        const response = await fetch(`/api/cars/${carId}`);
        const car = await response.json();
        return car;
    } catch (error) {
        console.error('Error loading car data:', error);
        return null;
    }
}

// Initialize all features when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('AJAX features initializing...');
    
    // Initialize animation controller for all pages
    const animationController = new AnimationController();
    animationController.initSmoothScrolling();
    animationController.initParallaxEffects();
    
    // Initialize based on current page
    const currentPage = document.body.dataset.page;
    
    switch (currentPage) {
        case 'cars':
        case 'home':
            new CarSearch();
            break;
        case 'car-details':
            new BookingManager();
            break;
        case 'contact':
            new ContactForm();
            break;
    }
    
    console.log('AJAX features initialized');
});

// Enhanced Navigation Functions
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
        dropdown.style.transform = dropdown.classList.contains('show') ? 'scale(1)' : 'scale(0.95)';
        dropdown.style.opacity = dropdown.classList.contains('show') ? '1' : '0';
    }
}

function toggleMobileMenu() {
    const mobileNav = document.getElementById('mobileNav');
    const overlay = document.getElementById('mobileNavOverlay');
    
    if (mobileNav && overlay) {
        mobileNav.classList.add('show');
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Animate menu items
        const menuItems = mobileNav.querySelectorAll('.mobile-nav-link');
        menuItems.forEach((item, index) => {
            setTimeout(() => {
                item.style.transform = 'translateX(0)';
                item.style.opacity = '1';
            }, index * 50);
        });
    }
}

function closeMobileMenu() {
    const mobileNav = document.getElementById('mobileNav');
    const overlay = document.getElementById('mobileNavOverlay');
    
    if (mobileNav && overlay) {
        mobileNav.classList.remove('show');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
        
        // Reset menu items
        const menuItems = mobileNav.querySelectorAll('.mobile-nav-link');
        menuItems.forEach(item => {
            item.style.transform = 'translateX(-20px)';
            item.style.opacity = '0';
        });
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const userMenu = document.querySelector('.user-menu');
    const dropdown = document.getElementById('userDropdown');
    
    if (userMenu && dropdown && !userMenu.contains(e.target)) {
        dropdown.classList.remove('show');
        dropdown.style.transform = 'scale(0.95)';
        dropdown.style.opacity = '0';
    }
});

// Car Management Functions
async function toggleCarAvailability(carId, newStatus) {
    try {
        const response = await fetch(`/admin/cars/${carId}/toggle-availability`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ available: newStatus })
        });

        if (!response.ok) {
            throw new Error('Failed to update car availability');
        }

        const result = await response.json();
        
        // Show success message
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message success';
        messageDiv.innerHTML = `
            <i class="fas fa-check-circle"></i>
            Car ${result.available ? 'enabled' : 'disabled'} successfully
        `;
        document.body.appendChild(messageDiv);
        
        // Remove message after 3 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);

        // Refresh the page to show updated status
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    } catch (error) {
        console.error('Error toggling car availability:', error);
        
        // Show error message
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message error';
        messageDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            ${error.message}
        `;
        document.body.appendChild(messageDiv);
        
        // Remove message after 3 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}

console.log('AJAX features script loaded'); 