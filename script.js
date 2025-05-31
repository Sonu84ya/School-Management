// DOM Elements
const sidebar = document.querySelector('.sidebar');
const navLinks = document.querySelectorAll('.nav-links li');
const searchInput = document.querySelector('.search-bar input');
const activityList = document.querySelector('.activity-list');

// Sample data for demonstration
const recentActivities = [
    { type: 'grade', message: 'New grades added for Class 10A', time: '2 hours ago' },
    { type: 'payment', message: 'Payment received from John Doe', time: '3 hours ago' },
    { type: 'student', message: 'New student registration: Sarah Smith', time: '5 hours ago' },
    { type: 'attendance', message: 'Attendance marked for Class 9B', time: '6 hours ago' }
];

// Navigation handling
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        // Remove active class from all links
        navLinks.forEach(l => l.classList.remove('active'));
        // Add active class to clicked link
        link.classList.add('active'); 
    });
});

// Search functionality
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    // Implement search logic here
    console.log('Searching for:', searchTerm);
});

// Load recent activities
function loadRecentActivities() {
    activityList.innerHTML = recentActivities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas ${getActivityIcon(activity.type)}"></i>
            </div>
            <div class="activity-details">
                <p>${activity.message}</p>
                <span class="activity-time">${activity.time}</span>
            </div>
        </div>
    `).join('');
}

// Helper function to get activity icon
function getActivityIcon(type) {
    const icons = {
        grade: 'fa-chart-bar',
        payment: 'fa-money-bill-wave',
        student: 'fa-user-graduate',
        attendance: 'fa-calendar-check'
    };
    return icons[type] || 'fa-info-circle';
}

// Initialize the application
function init() {
    loadRecentActivities();
    
    // Add responsive sidebar toggle for mobile
    if (window.innerWidth <= 768) {
        sidebar.classList.add('collapsed');
    }
}

// Event listener for window resize
window.addEventListener('resize', () => {
    if (window.innerWidth <= 768) {
        sidebar.classList.add('collapsed');
    } else {
        sidebar.classList.remove('collapsed');
    }
});

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Add smooth scrolling for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Finance Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Load students into payment form
    loadStudentsForPayment();
    
    // Initialize payment form
    initializePaymentForm();
    
    // Initialize filters
    initializeFilters();
    
    // Load initial payments
    updatePaymentsTable();
});

// Function to load students into payment form
function loadStudentsForPayment() {
    const studentSelect = document.getElementById('studentSelect');
    if (!studentSelect) return;

    const students = JSON.parse(localStorage.getItem('students')) || [];
    studentSelect.innerHTML = '<option value="">Select Student</option>' +
        students.map(student => `
            <option value="${student.studentId}">${student.fullName}</option>
        `).join('');
}

// Function to initialize payment form
function initializePaymentForm() {
    const paymentModal = document.getElementById('paymentModal');
    const paymentForm = document.getElementById('paymentForm');
    const recordPaymentBtn = document.getElementById('recordPaymentBtn');
    const cancelPaymentBtn = document.getElementById('cancelPayment');
    const closeModalBtn = document.querySelector('.close-modal');

    if (recordPaymentBtn) {
        recordPaymentBtn.addEventListener('click', () => {
            paymentModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            // Reset form when opening modal
            paymentForm.reset();
        });
    }

    if (cancelPaymentBtn) {
        cancelPaymentBtn.addEventListener('click', () => {
            paymentModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            paymentForm.reset();
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            paymentModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            paymentForm.reset();
        });
    }

    if (paymentModal) {
        paymentModal.addEventListener('click', (e) => {
            if (e.target === paymentModal) {
                paymentModal.style.display = 'none';
                document.body.style.overflow = 'auto';
                paymentForm.reset();
            }
        });
    }

    if (paymentForm) {
        paymentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Validate required fields
            const studentSelect = document.getElementById('studentSelect');
            const paymentType = document.getElementById('paymentType');
            const amount = document.getElementById('amount');
            const dueDate = document.getElementById('dueDate');
            const paymentStatus = document.getElementById('paymentStatus');

            if (!studentSelect.value || !paymentType.value || !amount.value || !dueDate.value || !paymentStatus.value) {
                showNotification('Please fill in all required fields', 'error');
                return;
            }

            try {
                // Create payment data object
                const formData = {
                    studentId: studentSelect.value,
                    studentName: studentSelect.options[studentSelect.selectedIndex].text,
                    paymentType: paymentType.value,
                    amount: parseFloat(amount.value),
                    dueDate: dueDate.value,
                    status: paymentStatus.value,
                    notes: document.getElementById('notes').value || '',
                    date: new Date().toISOString().split('T')[0]
                };

                // Save payment
                const saved = await savePayment(formData);
                
                if (saved) {
                    // Update UI
                    updatePaymentsTable();
                    updateFinancialStats();

                    // Close modal and reset form
                    paymentModal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                    paymentForm.reset();

                    // Show success message
                    showNotification('Payment recorded successfully!', 'success');
                }
            } catch (error) {
                console.error('Error saving payment:', error);
                showNotification('Error saving payment. Please try again.', 'error');
            }
        });
    }
}

// Function to initialize filters
function initializeFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const typeFilter = document.getElementById('typeFilter');
    const dateFilter = document.getElementById('dateFilter');
    const searchInput = document.querySelector('.search-bar input');

    if (statusFilter) {
        statusFilter.addEventListener('change', updatePaymentsTable);
    }
    if (typeFilter) {
        typeFilter.addEventListener('change', updatePaymentsTable);
    }
    if (dateFilter) {
        dateFilter.addEventListener('change', updatePaymentsTable);
    }
    if (searchInput) {
        searchInput.addEventListener('input', updatePaymentsTable);
    }
}

// Function to save payment
async function savePayment(paymentData) {
    try {
        // Get existing payments
        let payments = JSON.parse(localStorage.getItem('payments')) || [];
        
        // Add new payment
        payments.push(paymentData);
        
        // Save to localStorage
        localStorage.setItem('payments', JSON.stringify(payments));
        
        return true;
    } catch (error) {
        console.error('Error saving payment:', error);
        showNotification('Error saving payment. Please try again.', 'error');
        return false;
    }
}

// Function to update payments table
function updatePaymentsTable() {
    try {
        const tableBody = document.querySelector('.data-table tbody');
        if (!tableBody) {
            console.error('Payment table body not found');
            return;
        }

        const payments = JSON.parse(localStorage.getItem('payments')) || [];
        
        // Apply filters
        const statusFilter = document.getElementById('statusFilter')?.value || 'all';
        const typeFilter = document.getElementById('typeFilter')?.value || 'all';
        const dateFilter = document.getElementById('dateFilter')?.value || '';
        const searchTerm = document.querySelector('.search-bar input')?.value.toLowerCase() || '';

        const filteredPayments = payments.filter(payment => {
            const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
            const matchesType = typeFilter === 'all' || payment.paymentType === typeFilter;
            const matchesDate = !dateFilter || payment.dueDate === dateFilter;
            const matchesSearch = !searchTerm || 
                payment.studentName.toLowerCase().includes(searchTerm) ||
                payment.paymentType.toLowerCase().includes(searchTerm);

            return matchesStatus && matchesType && matchesDate && matchesSearch;
        });

        // Update table
        tableBody.innerHTML = filteredPayments.map((payment, index) => `
            <tr data-payment-id="${index}">
                <td>
                    <div class="student-info">
                        <img src="https://via.placeholder.com/40" alt="Student">
                        <span>${payment.studentName}</span>
                    </div>
                </td>
                <td>${payment.paymentType}</td>
                <td>$${payment.amount.toFixed(2)}</td>
                <td>${payment.dueDate}</td>
                <td><span class="status-badge ${payment.status}">${payment.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="editPayment(${index})"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon" onclick="generateInvoice(${index})"><i class="fas fa-file-invoice"></i></button>
                        <button class="btn-icon" onclick="deletePayment(${index})"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Update financial stats
        updateFinancialStats();
    } catch (error) {
        console.error('Error updating payments table:', error);
        showNotification('Error updating payments table. Please refresh the page.', 'error');
    }
}

// Function to update financial statistics
function updateFinancialStats() {
    try {
        const payments = JSON.parse(localStorage.getItem('payments')) || [];
        
        const totalRevenue = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        const pendingPayments = payments
            .filter(p => p.status === 'pending')
            .reduce((sum, payment) => sum + (payment.amount || 0), 0);
        const paidThisMonth = payments
            .filter(p => p.status === 'paid' && 
                new Date(p.date).getMonth() === new Date().getMonth())
            .reduce((sum, payment) => sum + (payment.amount || 0), 0);

        const totalRevenueElement = document.getElementById('totalRevenue');
        const pendingPaymentsElement = document.getElementById('pendingPayments');
        const paidThisMonthElement = document.getElementById('paidThisMonth');

        if (totalRevenueElement) totalRevenueElement.textContent = `$${totalRevenue.toFixed(2)}`;
        if (pendingPaymentsElement) pendingPaymentsElement.textContent = `$${pendingPayments.toFixed(2)}`;
        if (paidThisMonthElement) paidThisMonthElement.textContent = `$${paidThisMonth.toFixed(2)}`;
    } catch (error) {
        console.error('Error updating financial stats:', error);
        showNotification('Error updating financial statistics. Please refresh the page.', 'error');
    }
}

// Function to delete payment
function deletePayment(index) {
    if (confirm('Are you sure you want to delete this payment?')) {
        let payments = JSON.parse(localStorage.getItem('payments')) || [];
        payments.splice(index, 1);
        localStorage.setItem('payments', JSON.stringify(payments));
        updatePaymentsTable();
        showNotification('Payment deleted successfully!', 'success');
    }
}

// Function to edit payment
function editPayment(index) {
    try {
        const payments = JSON.parse(localStorage.getItem('payments')) || [];
        const payment = payments[index];
        
        if (!payment) {
            showNotification('Payment not found', 'error');
            return;
        }

        // Fill form with payment data
        const studentSelect = document.getElementById('studentSelect');
        const paymentType = document.getElementById('paymentType');
        const amount = document.getElementById('amount');
        const dueDate = document.getElementById('dueDate');
        const paymentStatus = document.getElementById('paymentStatus');
        const notes = document.getElementById('notes');

        if (!studentSelect || !paymentType || !amount || !dueDate || !paymentStatus || !notes) {
            showNotification('Error loading payment form', 'error');
            return;
        }

        studentSelect.value = payment.studentId;
        paymentType.value = payment.paymentType;
        amount.value = payment.amount;
        dueDate.value = payment.dueDate;
        paymentStatus.value = payment.status;
        notes.value = payment.notes || '';

        // Show modal
        const paymentModal = document.getElementById('paymentModal');
        if (!paymentModal) {
            showNotification('Error loading payment modal', 'error');
            return;
        }

        paymentModal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        // Update form submission handler
        const form = document.getElementById('paymentForm');
        if (!form) {
            showNotification('Error loading payment form', 'error');
            return;
        }

        const originalSubmitHandler = form.onsubmit;
        
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            try {
                // Validate required fields
                if (!studentSelect.value || !paymentType.value || !amount.value || !dueDate.value || !paymentStatus.value) {
                    showNotification('Please fill in all required fields', 'error');
                    return;
                }

                // Update payment data
                const updatedPayment = {
                    ...payment,
                    studentId: studentSelect.value,
                    studentName: studentSelect.options[studentSelect.selectedIndex].text,
                    paymentType: paymentType.value,
                    amount: parseFloat(amount.value),
                    dueDate: dueDate.value,
                    status: paymentStatus.value,
                    notes: notes.value
                };

                // Update payments array
                payments[index] = updatedPayment;

                // Save to localStorage
                localStorage.setItem('payments', JSON.stringify(payments));

                // Update UI
                updatePaymentsTable();
                updateFinancialStats();

                // Close modal
                paymentModal.style.display = 'none';
                document.body.style.overflow = 'auto';
                form.reset();

                // Restore original submit handler
                form.onsubmit = originalSubmitHandler;

                showNotification('Payment updated successfully!', 'success');
            } catch (error) {
                console.error('Error updating payment:', error);
                showNotification('Error updating payment. Please try again.', 'error');
            }
        };
    } catch (error) {
        console.error('Error in editPayment:', error);
        showNotification('Error loading payment details. Please try again.', 'error');
    }
}

// Function to generate invoice
function generateInvoice(index) {
    const payments = JSON.parse(localStorage.getItem('payments')) || [];
    const payment = payments[index];
    
    if (!payment) return;

    // Create invoice content
    const invoiceContent = `
        <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
            <h2 style="text-align: center;">Payment Invoice</h2>
            <div style="margin: 20px 0;">
                <p><strong>Student:</strong> ${payment.studentName}</p>
                <p><strong>Payment Type:</strong> ${payment.paymentType}</p>
                <p><strong>Amount:</strong> $${payment.amount.toFixed(2)}</p>
                <p><strong>Due Date:</strong> ${payment.dueDate}</p>
                <p><strong>Status:</strong> ${payment.status}</p>
                <p><strong>Date:</strong> ${payment.date}</p>
                ${payment.notes ? `<p><strong>Notes:</strong> ${payment.notes}</p>` : ''}
            </div>
        </div>
    `;

    // Open invoice in new window
    const invoiceWindow = window.open('', '_blank');
    invoiceWindow.document.write(`
        <html>
            <head>
                <title>Payment Invoice</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    @media print {
                        body { padding: 20px; }
                    }
                </style>
            </head>
            <body>
                ${invoiceContent}
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="window.print()">Print Invoice</button>
                </div>
            </body>
        </html>
    `);
    invoiceWindow.document.close();
}

// Function to show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add notification styles
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 4px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    }

    .notification.success {
        background-color: #4CAF50;
    }

    .notification.error {
        background-color: #f44336;
    }

    .notification.info {
        background-color: #2196F3;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Students Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    const studentModal = document.getElementById('studentModal');
    const studentForm = document.getElementById('studentForm');
    const addStudentBtn = document.getElementById('addStudentBtn');
    const closeModalBtn = document.querySelector('.close-modal');
    const cancelStudentBtn = document.getElementById('cancelStudent');

    // Open modal when clicking Add New Student button
    if (addStudentBtn) {
        addStudentBtn.addEventListener('click', () => {
            studentModal.style.display = 'block';
        });
    }

    // Close modal functions
    function closeModal() {
        studentModal.style.display = 'none';
        studentForm.reset();
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    if (cancelStudentBtn) {
        cancelStudentBtn.addEventListener('click', closeModal);
    }

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === studentModal) {
            closeModal();
        }
    });

    // Handle form submission
    if (studentForm) {
        studentForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Get form data
            const formData = {
                studentId: document.getElementById('studentId').value,
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                fullName: `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                class: document.getElementById('class').value,
                dob: document.getElementById('dob').value,
                address: document.getElementById('address').value,
                status: document.getElementById('status').value,
                dateAdded: new Date().toISOString().split('T')[0]
            };

            // Save student to localStorage
            saveStudent(formData);

            // Update the students table
            updateStudentsTable();

            // Close modal and reset form
            closeModal();

            // Show success message
            showNotification('Student added successfully!', 'success');
        });
    }

    // Search functionality
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', updateStudentsTable);
    }

    // Pagination functionality
    const paginationButtons = document.querySelectorAll('.pagination .btn-page');
    paginationButtons.forEach(button => {
        button.addEventListener('click', () => {
            paginationButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            updateStudentsTable();
        });
    });

    // Action buttons in table
    document.addEventListener('click', (e) => {
        if (e.target.closest('.btn-icon')) {
            const button = e.target.closest('.btn-icon');
            const action = button.querySelector('i').classList.contains('fa-edit') ? 'edit' : 'delete';
            const row = button.closest('tr');
            const studentId = row.dataset.studentId;

            if (action === 'edit') {
                editStudent(studentId);
            } else {
                deleteStudent(studentId);
            }
        }
    });

    // Initial load of students table
    updateStudentsTable();
});

// Image Upload Functionality
function previewImage(input) {
    const preview = document.getElementById('previewImg');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.src = e.target.result;
        }
        
        reader.readAsDataURL(input.files[0]);
    }
}

// Function to convert image to base64
function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Update saveStudent function to include image
async function saveStudent(studentData) {
    const imageFile = document.getElementById('studentImage').files[0];
    if (imageFile) {
        try {
            const base64Image = await getBase64(imageFile);
            studentData.profileImage = base64Image;
        } catch (error) {
            console.error('Error converting image:', error);
            studentData.profileImage = 'https://via.placeholder.com/150';
        }
    } else {
        studentData.profileImage = 'https://via.placeholder.com/150';
    }

    let students = JSON.parse(localStorage.getItem('students')) || [];
    students.push(studentData);
    localStorage.setItem('students', JSON.stringify(students));
}

// Update updateStudentsTable function to use stored images
function updateStudentsTable() {
    const tableBody = document.querySelector('.data-table tbody');
    if (!tableBody) return;

    let students = JSON.parse(localStorage.getItem('students')) || [];
    
    // Apply search filter
    const searchTerm = document.querySelector('.search-bar input').value.toLowerCase();
    students = students.filter(student => 
        student.fullName.toLowerCase().includes(searchTerm) ||
        student.studentId.toLowerCase().includes(searchTerm) ||
        student.email.toLowerCase().includes(searchTerm)
    );

    // Update table
    tableBody.innerHTML = students.map((student, index) => `
        <tr data-student-id="${index}">
            <td>${student.studentId}</td>
            <td>
                <div class="student-info">
                    <img src="${student.profileImage}" alt="Student">
                    <span>${student.fullName}</span>
                </div>
            </td>
            <td>${student.class}</td>
            <td>${student.email}</td>
            <td>${student.phone}</td>
            <td><span class="status-badge ${student.status}">${student.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Update editStudent function to handle images
async function editStudent(studentId) {
    const students = JSON.parse(localStorage.getItem('students')) || [];
    const student = students[studentId];
    
    if (!student) return;

    // Fill the form with student data
    document.getElementById('studentId').value = student.studentId;
    document.getElementById('firstName').value = student.firstName;
    document.getElementById('lastName').value = student.lastName;
    document.getElementById('email').value = student.email;
    document.getElementById('phone').value = student.phone;
    document.getElementById('class').value = student.class;
    document.getElementById('dob').value = student.dob;
    document.getElementById('address').value = student.address;
    document.getElementById('status').value = student.status;
    
    // Set the preview image
    const previewImg = document.getElementById('previewImg');
    previewImg.src = student.profileImage || 'https://via.placeholder.com/150';

    // Show modal
    document.getElementById('studentModal').style.display = 'block';

    // Update form submission handler
    const form = document.getElementById('studentForm');
    const originalSubmitHandler = form.onsubmit;
    
    form.onsubmit = async (e) => {
        e.preventDefault();
        
        const imageFile = document.getElementById('studentImage').files[0];
        let profileImage = student.profileImage;

        if (imageFile) {
            try {
                profileImage = await getBase64(imageFile);
            } catch (error) {
                console.error('Error converting image:', error);
            }
        }
        
        // Update student data
        students[studentId] = {
            ...student,
            studentId: document.getElementById('studentId').value,
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            fullName: `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            class: document.getElementById('class').value,
            dob: document.getElementById('dob').value,
            address: document.getElementById('address').value,
            status: document.getElementById('status').value,
            profileImage: profileImage
        };

        // Save updated students
        localStorage.setItem('students', JSON.stringify(students));

        // Update table
        updateStudentsTable();

        // Close modal
        document.getElementById('studentModal').style.display = 'none';
        form.reset();

        // Restore original submit handler
        form.onsubmit = originalSubmitHandler;

        // Show success message
        showNotification('Student updated successfully!', 'success');
    };
}

// Function to delete student
function deleteStudent(studentId) {
    if (confirm('Are you sure you want to delete this student?')) {
        let students = JSON.parse(localStorage.getItem('students')) || [];
        students.splice(studentId, 1);
        localStorage.setItem('students', JSON.stringify(students));
        updateStudentsTable();
        showNotification('Student deleted successfully!', 'success');
    }
}

// Grade Modal Functionality
const gradeModal = document.getElementById('gradeModal');
const addGradeBtn = document.getElementById('addGradeBtn');
const cancelGradeBtn = document.getElementById('cancelGrade');
const gradeForm = document.getElementById('gradeForm');

// Open grade modal
if (addGradeBtn) {
    addGradeBtn.addEventListener('click', () => {
        gradeModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    });
}

// Close grade modal
if (cancelGradeBtn) {
    cancelGradeBtn.addEventListener('click', () => {
        gradeModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
}

// Close grade modal when clicking outside
if (gradeModal) {
    gradeModal.addEventListener('click', (e) => {
        if (e.target === gradeModal) {
            gradeModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
}

// Handle grade form submission
if (gradeForm) {
    gradeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form values
        const student = document.getElementById('studentSelect').value;
        const subject = document.getElementById('subject').value;
        const term = document.getElementById('term').value;
        const marks = document.getElementById('marks').value;
        const grade = document.getElementById('grade').value;
        const status = document.getElementById('status').value;
        const remarks = document.getElementById('remarks').value;

        // Create new grade entry
        const newGrade = {
            student,
            subject,
            term,
            marks,
            grade,
            status,
            remarks
        };

        // Add to grades array
        grades.push(newGrade);

        // Update the table
        updateGradesTable();

        // Close modal and reset form
        gradeModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        gradeForm.reset();
    });
}

// Function to update grades table
function updateGradesTable() {
    const tableBody = document.querySelector('.data-table tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    grades.forEach((grade, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="student-info">
                    <img src="https://via.placeholder.com/40" alt="Student">
                    <span>${grade.student}</span>
                </div>
            </td>
            <td>${grade.subject}</td>
            <td>Term ${grade.term}</td>
            <td>${grade.marks}/100</td>
            <td>${grade.grade}</td>
            <td><span class="status-badge ${grade.status === 'published' ? 'active' : 'pending'}">${grade.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon" onclick="editGrade(${index})"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon" onclick="deleteGrade(${index})"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Function to edit grade
function editGrade(index) {
    const grade = grades[index];
    // Populate form with grade data
    document.getElementById('studentSelect').value = grade.student;
    document.getElementById('subject').value = grade.subject;
    document.getElementById('term').value = grade.term;
    document.getElementById('marks').value = grade.marks;
    document.getElementById('grade').value = grade.grade;
    document.getElementById('status').value = grade.status;
    document.getElementById('remarks').value = grade.remarks;

    // Show modal
    gradeModal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    // Update form submission handler
    gradeForm.onsubmit = (e) => {
        e.preventDefault();
        
        // Update grade data
        grades[index] = {
            student: document.getElementById('studentSelect').value,
            subject: document.getElementById('subject').value,
            term: document.getElementById('term').value,
            marks: document.getElementById('marks').value,
            grade: document.getElementById('grade').value,
            status: document.getElementById('status').value,
            remarks: document.getElementById('remarks').value
        };

        // Update table
        updateGradesTable();

        // Close modal and reset form
        gradeModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        gradeForm.reset();

        // Reset form submission handler
        gradeForm.onsubmit = null;
    };
}

// Function to delete grade
function deleteGrade(index) {
    if (confirm('Are you sure you want to delete this grade?')) {
        grades.splice(index, 1);
        updateGradesTable();
    }
}

// Initialize grades array
let grades = [];

