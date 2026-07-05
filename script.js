// Product names mapping - exact match with different formats
const productMapping = {
    // Exact matches from import
    'Mobile Banking (MB) Activated': 'mb-activated',
    'Mobile Banking (MB) Add & Reset': 'mb-add-reset',
    'ATM Card Registration': 'atm-registration',
    'ATM Card Activation or delivered': 'atm-activation',
    'ATM Card Activation or Delivered': 'atm-activation',
    'CBE Birr Activated': 'cbe-birr-activated',
    'CBE Birr Registration': 'cbe-birr-registration',
    'QR Recruitment': 'qr-recruitment',
    'QR Deployed': 'qr-deployed',
    'Merchant Reactivation': 'merchant-reactivation',
    'Merchant Registration': 'merchant-registration',
    'Internet Banking (IB) Registration': 'ib-registration',
    'Internet Banking (IB) Reactivation': 'ib-reactivation',
    'Star Pay': 'star-pay'
};

const products = {
    'mb-activated': 'Mobile Banking (MB) Activated',
    'mb-add-reset': 'Mobile Banking (MB) Add & Reset',
    'atm-registration': 'ATM Card Registration',
    'atm-activation': 'ATM Card Activation or Delivered',
    'cbe-birr-activated': 'CBE Birr Activated',
    'cbe-birr-registration': 'CBE Birr Registration',
    'qr-recruitment': 'QR Recruitment',
    'qr-deployed': 'QR Deployed',
    'merchant-reactivation': 'Merchant Reactivation',
    'merchant-registration': 'Merchant Registration',
    'ib-registration': 'Internet Banking (IB) Registration',
    'ib-reactivation': 'Internet Banking (IB) Reactivation',
    'star-pay': 'Star Pay'
};

const allBranches = [
    'ABADO CONDOMINIUM BR', 'ABWARE BRANCH', 'Diaspora Adebabay', 'ADEWA DILDY BRANCH', 'ALELTU',
    'AYAT BRANCH', 'BALDERAS BRANCH', 'BEKIE BRANCH', 'CATHERINE HAMLIN BRA', 'CMC Branch',
    'CMC Convention Center', 'DEJAZMACH WONDYRAD', 'GEDERA BRANCH', 'Gebriel Mesalemia Br', 'GETER MENAFESHA BR',
    'Harbuguba Branch', 'KARA BRANCH', 'KARA TERARA BRANCH', 'Kotebe Branch', 'Kotebe Kidane Mihiret',
    'KOTEBE ANKORCHA BRANCH', 'KOTEBE COLLAGE AREA BR', 'KOTEBE WELGEMO BRANCH', 'KULITI BERI BRANCH', 'LAMBERET BRANCH',
    'LEGEJIDA BRANCH', 'Legetafo Branch', 'LOKE BRANCH', 'Megenagna Branch', 'MENA REDIN BRANCH',
    'MISIRAK ATEKALAY BR', 'SALITEMIHRET BRANCH', 'SENA BERI BRANCH', 'SENDAFA BRANCH', 'Selassie Branch',
    'SHENO BRANCH', 'SHI 80 BRANCH', 'SHOBE AYAT BRANCH', 'SHOLA BRANCH', 'SHOLA GEBEYA BRANCH',
    'SHOLA MEBRAT BRANCH', 'SIGNAL BRANCH', 'TAFO ADEBABAY BRANCH', 'TAFO CONDOMINIUM BR', 'Tafo Mebrat Branch',
    'TULU BEREK BRANCH', 'WOSSEN AKABABI BRANCH', 'YEKA BRANCH', 'YEKA MICHAEL BRANCH', 'Yeka Abado Branch', 'Yeka Terara Branch'
];

// Initialize data from localStorage
let submissionsData = JSON.parse(localStorage.getItem('submissionsData')) || [];

// Tab switching
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', (e) => {
        const tabName = e.target.getAttribute('data-tab');
        switchTab(tabName);
    });
});

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName).classList.add('active');

    // Add active class to clicked button
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Load data for specific tabs
    if (tabName === 'dashboard') {
        updateDashboard();
    } else if (tabName === 'reports') {
        updateReports();
    }
}

// ============= BULK IMPORT FUNCTIONALITY =============

document.getElementById('bulkImportForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const textarea = document.getElementById('bulkDataTextarea').value.trim();
    const useAutoDate = document.getElementById('autoDate').checked;
    const importDate = useAutoDate ? new Date().toISOString().split('T')[0] : document.getElementById('importDate').value;

    if (!textarea) {
        showImportMessage('Please paste data to import', 'error');
        return;
    }

    if (!useAutoDate && !importDate) {
        showImportMessage('Please select a date for import', 'error');
        return;
    }

    try {
        const result = parseAndImportData(textarea, importDate);
        showImportMessage(result.message, result.success ? 'success' : 'error');
        
        if (result.success) {
            showImportStats(result.stats);
            document.getElementById('bulkImportForm').reset();
            document.getElementById('autoDate').checked = true;
            setTimeout(() => {
                document.querySelector('[data-tab="dashboard"]').click();
            }, 1500);
        }
    } catch (error) {
        showImportMessage(`Error: ${error.message}`, 'error');
    }
});

function parseAndImportData(text, importDate) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let currentBranch = null;
    let importedCount = 0;
    let productsCount = 0;
    let branchesCount = 0;
    const branchesAdded = new Set();

    for (let line of lines) {
        // Check if it's a product line (contains colon)
        if (line.includes(':')) {
            if (!currentBranch) {
                throw new Error('Found product data without a branch name');
            }

            const [productName, countStr] = line.split(':').map(s => s.trim());
            const count = parseInt(countStr);

            if (isNaN(count)) {
                throw new Error(`Invalid count value for "${productName}": ${countStr}`);
            }

            // Find matching product key
            const productKey = productMapping[productName];
            if (!productKey) {
                throw new Error(`Unknown product: "${productName}". Check spelling and format.`);
            }

            // Add submission
            submissionsData.push({
                id: Date.now() + Math.random(),
                branch: currentBranch,
                date: importDate,
                product: productKey,
                productName: products[productKey],
                count: count,
                notes: 'Imported from bulk data',
                timestamp: new Date().toISOString()
            });

            importedCount++;
            productsCount++;
        } else {
            // It's a branch name
            currentBranch = line;
            if (!branchesAdded.has(currentBranch)) {
                branchesAdded.add(currentBranch);
                branchesCount++;
            }
        }
    }

    if (importedCount === 0) {
        throw new Error('No valid data found to import');
    }

    // Save to localStorage
    localStorage.setItem('submissionsData', JSON.stringify(submissionsData));

    return {
        success: true,
        message: `✓ Successfully imported ${importedCount} product entries!`,
        stats: {
            branches: branchesCount,
            products: productsCount,
            date: importDate
        }
    };
}

function showImportMessage(message, type) {
    const messageBox = document.getElementById('importMessage');
    messageBox.textContent = message;
    messageBox.className = `message-box ${type}`;
    messageBox.style.display = 'block';

    if (type === 'error') {
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 5000);
    }
}

function showImportStats(stats) {
    const statsDiv = document.getElementById('importStats');
    statsDiv.innerHTML = `
        <h4>Import Summary</h4>
        <div class="stats-grid">
            <div class="stat-item">
                <div class="label">Branches</div>
                <div class="value">${stats.branches}</div>
            </div>
            <div class="stat-item">
                <div class="label">Products</div>
                <div class="value">${stats.products}</div>
            </div>
            <div class="stat-item">
                <div class="label">Import Date</div>
                <div class="value">${new Date(stats.date).toLocaleDateString()}</div>
            </div>
        </div>
    `;
    statsDiv.style.display = 'block';
}

// Toggle custom date input
document.getElementById('autoDate').addEventListener('change', (e) => {
    const customDateGroup = document.getElementById('customDateGroup');
    if (e.target.checked) {
        customDateGroup.style.display = 'none';
    } else {
        customDateGroup.style.display = 'block';
    }
});

// ============= MANUAL SUBMISSION FUNCTIONALITY =============

document.getElementById('submissionForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const branch = formData.get('branchName');
    const date = formData.get('submissionDate');
    const notes = formData.get('notes');

    if (!branch || !date) {
        alert('Please fill in Branch Name and Submission Date');
        return;
    }

    // Add each product as a separate submission
    for (const [key, value] of formData.entries()) {
        if (products[key] && value) {
            submissionsData.push({
                id: Date.now() + Math.random(),
                branch,
                date,
                product: key,
                productName: products[key],
                count: parseInt(value),
                notes,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Save to localStorage
    localStorage.setItem('submissionsData', JSON.stringify(submissionsData));

    // Reset form
    e.target.reset();
    document.getElementById('submissionDate').valueAsDate = new Date();

    // Show success message
    const successMsg = document.getElementById('successMessage');
    successMsg.style.display = 'block';
    setTimeout(() => {
        successMsg.style.display = 'none';
    }, 3000);
});

// Set today's date as default
document.getElementById('submissionDate').valueAsDate = new Date();
document.getElementById('importDate').valueAsDate = new Date();

// ============= DASHBOARD FUNCTIONALITY =============

function updateDashboard() {
    const filterBranch = document.getElementById('filterBranch').value.toLowerCase();
    const filterProduct = document.getElementById('filterProduct').value;

    let filteredData = submissionsData.filter(item => {
        const branchMatch = item.branch.toLowerCase().includes(filterBranch);
        const productMatch = !filterProduct || item.product === filterProduct;
        return branchMatch && productMatch;
    });

    // Update branch participation
    const uniqueBranches = new Set(submissionsData.map(item => item.branch));
    const branchesParticipated = uniqueBranches.size;
    const participationRate = Math.round((branchesParticipated / 51) * 100);

    document.getElementById('branchesParticipated').textContent = branchesParticipated;
    document.getElementById('participationRate').textContent = participationRate;
    document.getElementById('progressFill').style.width = participationRate + '%';

    // Update summary stats
    const totalCount = filteredData.reduce((sum, item) => sum + item.count, 0);

    document.getElementById('totalSubmissions').textContent = filteredData.length;
    document.getElementById('totalBranches').textContent = uniqueBranches.size;
    document.getElementById('totalProducts').textContent = totalCount;

    // Update product summary
    updateProductSummary();

    // Update table
    const tableBody = document.getElementById('tableBody');
    if (filteredData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="empty-state">No submissions match the filter</td></tr>';
    } else {
        tableBody.innerHTML = filteredData.map(item => `
            <tr>
                <td>${item.branch}</td>
                <td>${new Date(item.date).toLocaleDateString()}</td>
                <td>${item.productName}</td>
                <td><strong>${item.count}</strong></td>
                <td><button class="btn-delete" onclick="deleteSubmission(${item.id})">Delete</button></td>
            </tr>
        `).join('');
    }
}

function updateProductSummary() {
    const productStats = {};

    // Initialize all products
    Object.keys(products).forEach(key => {
        productStats[key] = {
            productName: products[key],
            branches: new Set(),
            totalCount: 0
        };
    });

    // Aggregate data
    submissionsData.forEach(item => {
        if (productStats[item.product]) {
            productStats[item.product].branches.add(item.branch);
            productStats[item.product].totalCount += item.count;
        }
    });

    // Generate HTML
    const grid = document.getElementById('productSummaryGrid');
    grid.innerHTML = Object.entries(productStats)
        .map(([key, stats]) => `
            <div class="product-summary-card">
                <div class="product-name">${stats.productName}</div>
                <div class="summary-stats-row">
                    <span class="summary-label">Branches:</span>
                    <span class="summary-value">${stats.branches.size}</span>
                </div>
                <div class="summary-stats-row">
                    <span class="summary-label">Total Count:</span>
                    <span class="summary-value">${stats.totalCount}</span>
                </div>
                <div class="summary-stats-row">
                    <span class="summary-label">Avg/Branch:</span>
                    <span class="summary-value">${stats.branches.size > 0 ? (stats.totalCount / stats.branches.size).toFixed(1) : 0}</span>
                </div>
            </div>
        `)
        .join('');
}

// Filter event listeners
document.getElementById('filterBranch').addEventListener('input', updateDashboard);
document.getElementById('filterProduct').addEventListener('change', updateDashboard);

function deleteSubmission(id) {
    if (confirm('Are you sure you want to delete this submission?')) {
        submissionsData = submissionsData.filter(item => item.id !== id);
        localStorage.setItem('submissionsData', JSON.stringify(submissionsData));
        updateDashboard();
    }
}

// ============= REPORTS FUNCTIONALITY =============

let branchChart = null;
let productChart = null;

function updateReports() {
    // Aggregate data by branch
    const branchData = {};
    const productData = {};

    submissionsData.forEach(item => {
        // Branch totals
        if (!branchData[item.branch]) {
            branchData[item.branch] = 0;
        }
        branchData[item.branch] += item.count;

        // Product totals
        if (!productData[item.product]) {
            productData[item.product] = 0;
        }
        productData[item.product] += item.count;
    });

    // Update Branch Chart
    const branchLabels = Object.keys(branchData).sort((a, b) => branchData[b] - branchData[a]).slice(0, 15);
    const branchValues = branchLabels.map(label => branchData[label]);

    const branchCtx = document.getElementById('branchChart').getContext('2d');
    if (branchChart) {
        branchChart.destroy();
    }
    branchChart = new Chart(branchCtx, {
        type: 'bar',
        data: {
            labels: branchLabels,
            datasets: [{
                label: 'Total Products',
                data: branchValues,
                backgroundColor: '#3498db',
                borderColor: '#2980b9',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Update Product Chart
    const productLabels = Object.keys(productData).map(key => products[key]);
    const productValues = Object.keys(productData).map(key => productData[key]);

    const productCtx = document.getElementById('productChart').getContext('2d');
    if (productChart) {
        productChart.destroy();
    }
    productChart = new Chart(productCtx, {
        type: 'doughnut',
        data: {
            labels: productLabels,
            datasets: [{
                data: productValues,
                backgroundColor: [
                    '#3498db', '#e74c3c', '#2ecc71', '#f39c12',
                    '#9b59b6', '#1abc9c', '#34495e', '#e67e22',
                    '#16a085', '#c0392b', '#27ae60', '#8e44ad', '#2980b9'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // Top Products
    const topProductsList = document.getElementById('topProducts');
    const sortedProducts = Object.entries(productData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    topProductsList.innerHTML = sortedProducts.map(([key, count]) => `
        <div class="product-card">
            <h4>${products[key]}</h4>
            <p>${count}</p>
        </div>
    `).join('');

    // Branch Summary
    const branchSummary = document.getElementById('branchSummary');
    const sortedBranches = Object.entries(branchData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    branchSummary.innerHTML = sortedBranches.map(([branch, count]) => `
        <div class="branch-card">
            <h4>${branch}</h4>
            <p>${count}</p>
        </div>
    `).join('');
}

// ============= EXPORT FUNCTIONALITY =============

function exportToCSV() {
    if (submissionsData.length === 0) {
        alert('No data to export');
        return;
    }

    let csv = 'Branch,Date,Product,Count,Notes\n';

    submissionsData.forEach(item => {
        csv += `"${item.branch}","${item.date}","${item.productName}",${item.count},"${item.notes || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-compiler-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

function exportToExcel() {
    if (submissionsData.length === 0) {
        alert('No data to export');
        return;
    }

    // Prepare data for main sheet
    const mainData = [['Branch', 'Date', 'Product', 'Count', 'Notes']];
    submissionsData.forEach(item => {
        mainData.push([
            item.branch,
            item.date,
            item.productName,
            item.count,
            item.notes || ''
        ]);
    });

    // Prepare summary data
    const productStats = {};
    Object.keys(products).forEach(key => {
        productStats[key] = {
            productName: products[key],
            branches: new Set(),
            totalCount: 0
        };
    });

    submissionsData.forEach(item => {
        if (productStats[item.product]) {
            productStats[item.product].branches.add(item.branch);
            productStats[item.product].totalCount += item.count;
        }
    });

    const summaryData = [['Product', 'Number of Branches', 'Total Count', 'Average per Branch']];
    Object.entries(productStats).forEach(([key, stats]) => {
        summaryData.push([
            stats.productName,
            stats.branches.size,
            stats.totalCount,
            stats.branches.size > 0 ? (stats.totalCount / stats.branches.size).toFixed(2) : 0
        ]);
    });

    // Prepare branch participation data
    const uniqueBranches = new Set(submissionsData.map(item => item.branch));
    const participationData = [
        ['Metric', 'Value'],
        ['Total Branches', 51],
        ['Branches Participated', uniqueBranches.size],
        ['Participation Rate (%)', Math.round((uniqueBranches.size / 51) * 100)]
    ];

    // Create workbook and sheets
    const wb = XLSX.utils.book_new();
    
    const ws1 = XLSX.utils.aoa_to_sheet(mainData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Submissions');
    
    const ws2 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Product Summary');
    
    const ws3 = XLSX.utils.aoa_to_sheet(participationData);
    XLSX.utils.book_append_sheet(wb, ws3, 'Participation');

    // Set column widths
    ws1['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 40 }, { wch: 10 }, { wch: 30 }];
    ws2['!cols'] = [{ wch: 40 }, { wch: 20 }, { wch: 15 }, { wch: 20 }];
    ws3['!cols'] = [{ wch: 25 }, { wch: 20 }];

    // Save file
    const filename = `data-compiler-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
}

// Initial load
updateDashboard();
