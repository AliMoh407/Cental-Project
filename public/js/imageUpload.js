class ImageUploader {
    constructor(options = {}) {
        this.dropZone = options.dropZone;
        this.previewContainer = options.previewContainer;
        this.fileInput = options.fileInput;
        this.maxFiles = options.maxFiles || 5;
        this.maxFileSize = options.maxFileSize || 5 * 1024 * 1024; // 5MB
        this.acceptedTypes = options.acceptedTypes || ['image/jpeg', 'image/png', 'image/gif'];
        this.onFilesSelected = options.onFilesSelected || (() => {});
        
        this.initialize();
    }

    initialize() {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        // Highlight drop zone when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, this.highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, this.unhighlight, false);
        });

        // Handle dropped files
        this.dropZone.addEventListener('drop', this.handleDrop.bind(this), false);

        // Handle file input change
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    highlight() {
        this.dropZone.classList.add('highlight');
    }

    unhighlight() {
        this.dropZone.classList.remove('highlight');
    }

    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        this.handleFiles(files);
    }

    handleFileSelect(e) {
        const files = e.target.files;
        this.handleFiles(files);
    }

    handleFiles(files) {
        const validFiles = Array.from(files).filter(file => {
            if (!this.acceptedTypes.includes(file.type)) {
                this.showError(`${file.name} is not a valid image file`);
                return false;
            }
            if (file.size > this.maxFileSize) {
                this.showError(`${file.name} is too large. Maximum size is ${this.maxFileSize / (1024 * 1024)}MB`);
                return false;
            }
            return true;
        });

        if (validFiles.length > this.maxFiles) {
            this.showError(`You can only upload up to ${this.maxFiles} images`);
            return;
        }

        this.previewFiles(validFiles);
        this.onFilesSelected(validFiles);
    }

    previewFiles(files) {
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.createElement('div');
                preview.className = 'image-preview-container';
                preview.innerHTML = `
                    <img src="${e.target.result}" class="image-preview" alt="Preview">
                    <button type="button" class="remove-image" title="Remove image">×</button>
                `;

                // Add remove functionality
                const removeButton = preview.querySelector('.remove-image');
                removeButton.addEventListener('click', () => {
                    preview.remove();
                    // Update file input
                    const dt = new DataTransfer();
                    const files = this.fileInput.files;
                    for (let i = 0; i < files.length; i++) {
                        if (files[i] !== file) {
                            dt.items.add(files[i]);
                        }
                    }
                    this.fileInput.files = dt.files;
                });

                this.previewContainer.appendChild(preview);
            };
            reader.readAsDataURL(file);
        });
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger';
        errorDiv.textContent = message;
        this.dropZone.parentNode.insertBefore(errorDiv, this.dropZone.nextSibling);
        setTimeout(() => errorDiv.remove(), 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const previewContainer = document.getElementById('imagePreview');
    const fileInput = document.getElementById('images');

    if (dropZone && previewContainer && fileInput) {
        new ImageUploader({
            dropZone,
            previewContainer,
            fileInput,
            maxFiles: 5,
            maxFileSize: 5 * 1024 * 1024, // 5MB
            acceptedTypes: ['image/jpeg', 'image/png', 'image/gif'],
            onFilesSelected: (files) => {
                console.log('Files selected:', files);
            }
        });
    }
}); 