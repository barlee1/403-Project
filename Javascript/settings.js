// Get the color picker and buttons
const colorPicker = document.getElementById("color-picker");
const applyColorBtn = document.getElementById("apply-color-btn");
const resetColorBtn = document.getElementById("reset-color-btn");

// Default color scheme (original theme color)
const defaultColor = "#4e73df"; // Default blue color
const defaultHeaderColor = "#3e5bb1"; // Slightly darker shade for header
const defaultSidebarColor = "#759bec"; // Default sidebar color

// Track if color has been applied
let colorApplied = false;

/**
 * Apply selected color theme to the page.
 */
function applyColor() {
    const selectedColor = colorPicker.value;

    // Update CSS variables for the theme colors
    document.documentElement.style.setProperty('--theme-color', selectedColor);
    document.documentElement.style.setProperty('--header-color', darkenColor(selectedColor, 0.15)); // Darker shade for header
    document.documentElement.style.setProperty('--sidebar-color', selectedColor); // Sidebar matches theme color

    // Set colorApplied to true to indicate color has been applied
    colorApplied = true;

    // Disable "Test Color" button and enable the "Reset Color" button
    applyColorBtn.disabled = true;  // Disable Apply button
    resetColorBtn.disabled = false; // Enable Reset button
}

/**
 * Reset the theme colors to the default values.
 */
function resetColor() {
    if (colorApplied) {
        // Restore default colors
        document.documentElement.style.setProperty('--theme-color', defaultColor);
        document.documentElement.style.setProperty('--header-color', defaultHeaderColor);
        document.documentElement.style.setProperty('--sidebar-color', defaultSidebarColor);

        // Set colorApplied to false because we're resetting to defaults
        colorApplied = false;

        // Disable "Reset Color" button and enable the "Test Color" button
        resetColorBtn.disabled = true;  // Disable Reset button
        applyColorBtn.disabled = false; // Enable Apply button
    }
}

/**
 * Helper function to darken a color by a percentage.
 * @param {string} color - The original hex color.
 * @param {number} percent - The percentage to darken the color.
 * @returns {string} The darkened color as a hex string.
 */
function darkenColor(color, percent) {
    let colorHex = color.startsWith("#") ? color.slice(1) : color; // Remove '#' if present
    let r = parseInt(colorHex.slice(0, 2), 16); // Extract red
    let g = parseInt(colorHex.slice(2, 4), 16); // Extract green
    let b = parseInt(colorHex.slice(4, 6), 16); // Extract blue

    // Adjust each color channel by the darkening percentage
    r = Math.floor(r * (1 - percent));
    g = Math.floor(g * (1 - percent));
    b = Math.floor(b * (1 - percent));

    // Return the darkened color in hex format
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Event listeners for the Apply and Reset buttons
applyColorBtn.addEventListener("click", applyColor); // Apply selected color
resetColorBtn.addEventListener("click", resetColor); // Reset to default colors

// Initial load: Apply the default colors
resetColor();


/**
 * Attach the event listener to all current and future select elements.
 */
function attachCategorySelectListeners() {
    // Attach to existing rows
    document.querySelectorAll('.category-select').forEach(selectElement => {
        selectElement.removeEventListener('change', handleCategorySelectChange); // Remove previous listeners to prevent duplicates
        selectElement.addEventListener('change', handleCategorySelectChange);
    });
}

/**
 * Add a new row for an expense category.
 */
document.querySelector('.add-new-expense-category').addEventListener('click', () => {
    const tableBody = document.querySelector('.expense-categories-table tbody');
    const newRow = document.createElement('tr');
    newRow.classList.add('expense-category-row');
    newRow.innerHTML = `
        <td>
            <!-- Dropdown for Icon (Emoji) -->
            <select name="expenseEmoji" id="expenseEmoji">
                <option value="Prize Money">🥇 (1st Place Medal)</option>
                <option value="Emergency Fund">🚑 (Ambulance)</option>
                <option value="Child Support">👶 (Baby)</option>
                <option value="Legal Fees">⚖️ (Balance Scale)</option>
                <option value="Business Profits">📊 (Bar Chart)</option>
                <option value="Sports & Recreation">🏀 (Basketball)</option>
                <option value="Textbooks & Supplies">📚 (Books)</option>
                <option value="Government Assistance">💼 (Briefcase)</option>
                <option value="Home Maintenance">🧹 (Broom)</option>
                <option value="Transportation">🚗 (Car)</option>
                <option value="Groceries">🥕 (Carrot)</option>
                <option value="Stocks">📉 (Chart Decreasing)</option>
                <option value="Investments">📈 (Chart Increasing)</option>
                <option value="Entertainment">🎬 (Clapper Board)</option>
                <option value="Side Business">🏪 (Convenience Store)</option>
                <option value="Dividends">💳 (Credit Card)</option>
                <option value="Freelance Work">🖥️ (Desktop Computer)</option>
                <option value="Pets">🐕 (Dog)</option>
                <option value="Student Loans">💵 (Dollar Banknote)</option>
                <option value="Clothing">👗 (Dress)</option>
                <option value="Royalties">📀 (DVD)</option>
                <option value="Family Support">👨‍👩‍👧‍👦 (Family)</option>
                <option value="Gifts">🎁 (Gift)</option>
                <option value="Crowdfunding">🌐 (Globe with Meridians)</option>
                <option value="Scholarships">🎓 (Graduation Cap)</option>
                <option value="Miscellaneous">🛠️ (Hammer and Wrench)</option>
                <option value="Partnership">🤝 (Handshake)</option>
                <option value="Subscriptions">🎧 (Headphone)</option>
                <option value="Charity">❤️ (Heart)</option>
                <option value="Inheritance">🏠 (House)</option>
                <option value="Rental Income">🏘️ (Houses)</option>
                <option value="Utilities">💡 (Light Bulb)</option>
                <option value="Commissions">💰 (Money Bag)</option>
                <option value="Cash Gifts">💸 (Money with Wings)</option>
                <option value="Pension">🧓 (Older Person)</option>
                <option value="Phone & Internet">📱 (Phone)</option>
                <option value="Health & Insurance">💊 (Pill)</option>
                <option value="Dining Out">🍽️ (Plate with Cutlery)</option>
                <option value="Alimony">💍 (Ring)</option>
                <option value="Medical Expenses">🩺 (Stethoscope)</option>
                <option value="Wrench">🔧 (Wrench)</option>
                <option value="Vacation">✈️ (Airplane)</option>
            </select>
        </td>
        <td>
            <select name="category-name" class="category-select" required>
                <option value="Tuition & Fees">Tuition & Fees</option>
                <option value="Textbooks & Supplies">Textbooks & Supplies</option>
                <option value="Housing">Housing</option>
                <option value="Utilities">Utilities</option>
                <option value="Groceries">Groceries</option>
                <option value="Dining Out">Dining Out</option>
                <option value="Transportation">Transportation</option>
                <option value="Health & Insurance">Health & Insurance</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Clothing">Clothing</option>
                <option value="Personal Care">Personal Care</option>
                <option value="Phone & Internet">Phone & Internet</option>
                <option value="Sports & Recreation">Sports & Recreation</option>
                <option value="Miscellaneous">Miscellaneous</option>
            </select>
        </td>
        <td>
            <div class="budget-goal-container">
                <span class="currency-symbol">$</span>
                <input type="text" class="budget-goal-input" placeholder="0.00" required>
                <span class="per-month-text">per month</span>
            </div>
        </td>
        <td>
            <!-- Edit -->
            <button type="button" class="edit-category" style="background-color: var(--theme-color); color: white;">Edit</button>
        </td>
        <td>
            <!-- Save Button -->
            <button type="button" class="save-category" style="background-color: var(--theme-color); color: white;">Save</button>
        </td>
        <td>
            <button type="button" class="delete-category" style="background-color: #c82333;">Delete</button>
        </td>
    `;
    tableBody.appendChild(newRow);

    // Reattach listeners to include the new row
    attachCategorySelectListeners();
});

/**
 * Add a new row for an income category.
 */
document.querySelector('.add-new-income-category').addEventListener('click', () => {
    const tableBody = document.querySelector('.income-categories-table tbody');
    const newRow = document.createElement('tr');
    newRow.classList.add('income-category-row');
    newRow.innerHTML = `
        <td>
            <!-- Dropdown for Icon (Emoji) -->
            <select name="incomeEmoji" id="incomeEmoji">
                <option value="Prize Money">🥇 (1st Place Medal)</option>
                <option value="Emergency Fund">🚑 (Ambulance)</option>
                <option value="Child Support">👶 (Baby)</option>
                <option value="Legal Fees">⚖️ (Balance Scale)</option>
                <option value="Business Profits">📊 (Bar Chart)</option>
                <option value="Sports & Recreation">🏀 (Basketball)</option>
                <option value="Textbooks & Supplies">📚 (Books)</option>
                <option value="Government Assistance">💼 (Briefcase)</option>
                <option value="Home Maintenance">🧹 (Broom)</option>
                <option value="Transportation">🚗 (Car)</option>
                <option value="Groceries">🥕 (Carrot)</option>
                <option value="Stocks">📉 (Chart Decreasing)</option>
                <option value="Investments">📈 (Chart Increasing)</option>
                <option value="Entertainment">🎬 (Clapper Board)</option>
                <option value="Side Business">🏪 (Convenience Store)</option>
                <option value="Dividends">💳 (Credit Card)</option>
                <option value="Freelance Work">🖥️ (Desktop Computer)</option>
                <option value="Pets">🐕 (Dog)</option>
                <option value="Student Loans">💵 (Dollar Banknote)</option>
                <option value="Clothing">👗 (Dress)</option>
                <option value="Royalties">📀 (DVD)</option>
                <option value="Family Support">👨‍👩‍👧‍👦 (Family)</option>
                <option value="Gifts">🎁 (Gift)</option>
                <option value="Crowdfunding">🌐 (Globe with Meridians)</option>
                <option value="Scholarships">🎓 (Graduation Cap)</option>
                <option value="Miscellaneous">🛠️ (Hammer and Wrench)</option>
                <option value="Partnership">🤝 (Handshake)</option>
                <option value="Subscriptions">🎧 (Headphone)</option>
                <option value="Charity">❤️ (Heart)</option>
                <option value="Inheritance">🏠 (House)</option>
                <option value="Rental Income">🏘️ (Houses)</option>
                <option value="Utilities">💡 (Light Bulb)</option>
                <option value="Commissions">💰 (Money Bag)</option>
                <option value="Cash Gifts">💸 (Money with Wings)</option>
                <option value="Pension">🧓 (Older Person)</option>
                <option value="Phone & Internet">📱 (Phone)</option>
                <option value="Health & Insurance">💊 (Pill)</option>
                <option value="Dining Out">🍽️ (Plate with Cutlery)</option>
                <option value="Alimony">💍 (Ring)</option>
                <option value="Medical Expenses">🩺 (Stethoscope)</option>
                <option value="Wrench">🔧 (Wrench)</option>
                <option value="Vacation">✈️ (Airplane)</option>
            </select>
        </td>
        <td>
            <select name="category-name" class="category-select" required>
                <option value="Part-Time Job">Paycheck</option>
                <option value="Scholarships">Scholarships</option>
                <option value="Student Loans">Student Loan Receipt</option>
                <option value="Family Support">Family Support</option>
                <option value="Grants">Grants</option>
                <option value="Gifts">Gifts</option>
                <option value="Investments">Investments</option>
            </select>
        </td>
        <td>
            <div class="budget-goal-container">
                <span class="currency-symbol">$</span>
                <input type="text" class="budget-goal-input" placeholder="0.00" required>
                <span class="per-month-text">per month</span>
            </div>
        </td>
        <td>
            <!-- Edit -->
            <button type="button" class="edit-category" style="background-color: var(--theme-color); color: white;">Edit</button>
        </td>
        <td>
            <!-- Save Button -->
            <button type="button" class="save-category" style="background-color: var(--theme-color); color: white;">Save</button>
        </td>
        <td>
            <button type="button" class="delete-category" style="background-color: #c82333;">Delete</button>
        </td>
    `;
    tableBody.appendChild(newRow);

    // Reattach listeners to include the new row
    attachCategorySelectListeners();
});

/**
 * Delete a row (for both expense and income categories).
 */
document.addEventListener('click', (event) => {
    if (event.target.classList.contains('delete-category')) {
        const row = event.target.closest('tr'); // Find the closest row to the delete button
        row.remove(); // Remove the row from the table
    }
});

