/* ==========================================================================
   1. NAVIGATION SYSTEM (Sidebar & Tool Switching)
   ========================================================================== */
function showTool(toolId) {
    // Hide all tool sections
    document.querySelectorAll('.tool-section').forEach(sec => {
        sec.style.display = 'none';
        sec.classList.remove('active-tool');
    });

    // Show the selected tool
    const selected = document.getElementById(toolId);
    if (selected) {
        selected.style.display = 'block';
        selected.classList.add('active-tool');
    }

    // Update Sidebar Active State
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const activeNav = document.getElementById('nav-' + toolId);
    if (activeNav) {
        activeNav.classList.add('active');
    }
}

/* ==========================================================================
   2. PASSPORT PHOTO MAKER (Core Logic)
   ========================================================================== */

// Global Variables for Passport Tool
let currentPhotoUrl = null;
let cropper = null;

/**
 * A. Handle File Upload & Initialize Cropper
 */
document.getElementById('passportInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        // Update UI Text
        const statusText = document.getElementById('fileNameDisplay');
        statusText.innerText = "Opening Cropper...";
        statusText.style.color = "#4e54c8";

        const reader = new FileReader();
        reader.onload = function(event) {
            // Open Crop Modal
            document.getElementById('cropModal').style.display = 'flex';

            // Set Image Source
            const imageElement = document.getElementById('imageToCrop');
            imageElement.src = event.target.result;

            // Destroy existing cropper if any
            if (cropper) {
                cropper.destroy();
            }

            // Initialize New Cropper
            cropper = new Cropper(imageElement, {
                aspectRatio: 3.5 / 4.5, // Standard Indian Passport Ratio
                viewMode: 1,
                autoCropArea: 0.9,
            });
        };
        reader.readAsDataURL(file);
    }
});

/**
 * B. Crop Image & Save to Grid
 */
function cropAndSave() {
    if (!cropper) return;

    // Get High Quality Cropped Image
    const canvas = cropper.getCroppedCanvas({
        width: 600,
        height: 600 * (4.5 / 3.5)
    });

    // Save to Global Variable
    currentPhotoUrl = canvas.toDataURL('image/jpeg');

    // Update UI Status
    const statusText = document.getElementById('fileNameDisplay');
    statusText.innerText = "✅ Image Cropped!";
    statusText.style.color = "#10b981";

    // Close Modal & Generate Grid
    closeCropModal();
    generateGrid();
}

/**
 * C. Close Modal & Reset
 */
function closeCropModal() {
    document.getElementById('cropModal').style.display = 'none';
    document.getElementById('passportInput').value = ''; // Reset input to allow re-upload
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
}

/**
 * D. Toggle Settings (Custom Size & Quantity)
 */
function toggleCustomSize() {
    const preset = document.getElementById('sizePreset').value;
    const customBox = document.getElementById('customSizeBox');

    if (preset === 'custom') {
        customBox.style.display = 'block';
    } else {
        customBox.style.display = 'none';
        generateGrid(); // Auto refresh
    }
}

function toggleCustomQty() {
    const qtySelect = document.getElementById('printQty');
    const customInput = document.getElementById('customQtyInput');

    // Check if elements exist to prevent errors
    if (qtySelect && customInput) {
        if (qtySelect.value === 'custom') {
            customInput.style.display = 'block';
            customInput.focus();
        } else {
            customInput.style.display = 'none';
            generateGrid();
        }
    }
}

/**
 * E. MAIN FUNCTION: Generate Photo Grid
 */
function generateGrid() {
    if (!currentPhotoUrl) return; // Do nothing if no photo exists

    const grid = document.getElementById('passportGrid');
    grid.innerHTML = ''; // Clear previous grid

    // 1. Get User Settings
    const preset = document.getElementById('sizePreset').value;
    const qtyOption = document.getElementById('printQty').value;
    const gap = parseFloat(document.getElementById('photoGap').value) || 0;

    let widthMM, heightMM;

    // 2. Set Dimensions (in MM)
    switch (preset) {
        case 'indian': widthMM = 35; heightMM = 45; break;
        case 'stamp':  widthMM = 20; heightMM = 25; break;
        case 'visa':   widthMM = 50.8; heightMM = 50.8; break;
        case 'pan':    widthMM = 25; heightMM = 35; break;
        case 'custom':
            widthMM = parseFloat(document.getElementById('customW').value) || 35;
            heightMM = parseFloat(document.getElementById('customH').value) || 45;
            break;
        default: widthMM = 35; heightMM = 45;
    }

    // 3. Calculate Quantity
    let count = 0;

    if (qtyOption === 'max') {
        // Auto Fit Logic (A4 Size - Margins)
        const pageW = 190;
        const pageH = 277;
        const cols = Math.floor(pageW / (widthMM + gap));
        const rows = Math.floor(pageH / (heightMM + gap));
        count = cols * rows;
    } else if (qtyOption === 'custom') {
        const customVal = parseInt(document.getElementById('customQtyInput').value);
        count = customVal > 0 ? customVal : 0;
    } else {
        count = parseInt(qtyOption);
    }

    // 4. Create Grid Elements
    for (let i = 0; i < count; i++) {
        const wrapper = document.createElement('div');
        wrapper.className = 'photo-wrapper';

        // Apply Styles
        wrapper.style.width = widthMM + 'mm';
        wrapper.style.height = heightMM + 'mm';
        wrapper.style.marginRight = gap + 'mm';
        wrapper.style.marginBottom = gap + 'mm';

        const img = document.createElement('img');
        img.src = currentPhotoUrl;

        wrapper.appendChild(img);
        grid.appendChild(wrapper);
    }
}

/**
 * F. Download JPG Feature
 */
function downloadJPG() {
    const element = document.getElementById('passportGrid');
    const btn = event.currentTarget; // The button that was clicked
    const oldText = btn.innerHTML;

    // Show loading state
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    html2canvas(element, {
        scale: 2, // 2x Resolution for better quality
        backgroundColor: "#ffffff",
        useCORS: true
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'MahaTools-Passport.jpg';
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();

        // Restore button text
        btn.innerHTML = oldText;
    });
}


/* ==========================================================================
   3. RESUME / BIODATA BUILDER
   ========================================================================== */
function updateResume() {
    const fields = [
        { input: 'resName', view: 'viewName', default: 'Your Name' },
        { input: 'resJob', view: 'viewJob', default: 'Designation' },
        { input: 'resContact', view: 'viewContact', default: 'Phone | Email' },
        { input: 'resAddress', view: 'viewAddress', default: 'Address will appear here...' },
        { input: 'resEdu', view: 'viewEdu', default: 'Education Details...' },
        { input: 'resExp', view: 'viewExp', default: 'Experience Details...' }
    ];

    fields.forEach(field => {
        const inputElem = document.getElementById(field.input);
        const viewElem = document.getElementById(field.view);
        
        if (inputElem && viewElem) {
            viewElem.innerText = inputElem.value || field.default;
        }
    });
}


/* ==========================================================================
   4. INVOICE / QUOTATION GENERATOR
   ========================================================================== */
// Initialize Date
const dateElement = document.getElementById('billDate');
if (dateElement) {
    dateElement.innerText = new Date().toLocaleDateString();
}

function updateBillHeader() {
    const client = document.getElementById('clientName').value;
    document.getElementById('viewClient').innerText = client || "Client Name";
}

let billTotal = 0;

function addItem() {
    const desc = document.getElementById('itemDesc').value;
    const qty = parseFloat(document.getElementById('itemQty').value) || 0;
    const price = parseFloat(document.getElementById('itemPrice').value) || 0;

    if (desc && qty > 0 && price > 0) {
        const total = qty * price;
        billTotal += total;

        const tbody = document.getElementById('billBody');
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${desc}</td>
            <td class="text-center">${qty}</td>
            <td class="text-right">₹${price.toFixed(2)}</td>
            <td class="text-right">₹${total.toFixed(2)}</td>
        `;

        tbody.appendChild(tr);
        document.getElementById('billTotal').innerText = billTotal.toFixed(2);

        // Clear Inputs
        document.getElementById('itemDesc').value = '';
        document.getElementById('itemQty').value = '';
        document.getElementById('itemPrice').value = '';
    } else {
        alert("Please enter valid Item Name, Quantity, and Price.");
    }
}


/* ==========================================================================
   5. IMAGE RESIZER (COMPRESSOR)
   ========================================================================== */
const compressInput = document.getElementById('compressInput');

if (compressInput) {
    compressInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        // UI Updates
        document.getElementById('loadingText').style.display = 'block';
        document.getElementById('resultArea').style.display = 'none';
        document.getElementById('origSize').innerText = (file.size / 1024).toFixed(2) + " KB";

        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = function(event) {
            const img = new Image();
            img.src = event.target.result;

            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Resize Logic (Scale to 60%)
                const scaleFactor = 0.6;
                canvas.width = img.width * scaleFactor;
                canvas.height = img.height * scaleFactor;

                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Compress Output (JPEG 70% Quality)
                canvas.toBlob(function(blob) {
                    const newSize = (blob.size / 1024).toFixed(2);

                    // Show Results
                    document.getElementById('loadingText').style.display = 'none';
                    document.getElementById('resultArea').style.display = 'block';
                    document.getElementById('newSize').innerText = newSize + " KB";

                    const url = URL.createObjectURL(blob);
                    document.getElementById('compressedImg').src = url;
                    document.getElementById('downloadBtn').href = url;

                }, 'image/jpeg', 0.7);
            }
        }
    });
}