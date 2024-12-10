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
    const darkerThemeColor = darkenColor(selectedColor, 0.15);

    // Update CSS variables for the theme colors
    document.documentElement.style.setProperty('--theme-color', selectedColor);
    document.documentElement.style.setProperty('--header-color', darkerThemeColor); // Darker shade for header
    document.documentElement.style.setProperty('--sidebar-color', selectedColor); // Sidebar matches theme color
    console.log(selectedColor, darkerThemeColor)
    // Set colorApplied to true to indicate color has been applied
    colorApplied = true;
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
            <select name="icon" id="icon" required>
                <option value="🥇">🥇 (1st Place Medal)</option>
                <option value="🚑">🚑 (Ambulance)</option>
                <option value="👶">👶 (Baby)</option>
                <option value="⚖️">⚖️ (Balance Scale)</option>
                <option value="📊">📊 (Bar Chart)</option>
                <option value="🏀">🏀 (Basketball)</option>
                <option value="📚">📚 (Books)</option>
                <option value="💼">💼 (Briefcase)</option>
                <option value="🧹">🧹 (Broom)</option>
                <option value="🚗">🚗 (Car)</option>
                <option value="🥕">🥕 (Carrot)</option>
                <option value="📉">📉 (Chart Decreasing)</option>
                <option value="📈">📈 (Chart Increasing)</option>
                <option value="🎬">🎬 (Clapper Board)</option>
                <option value="🏪">🏪 (Convenience Store)</option>
                <option value="💳">💳 (Credit Card)</option>
                <option value="🖥️">🖥️ (Desktop Computer)</option>
                <option value="🐕">🐕 (Dog)</option>
                <option value="💵">💵 (Dollar Banknote)</option>
                <option value="👗">👗 (Dress)</option>
                <option value="📀">📀 (DVD)</option>
                <option value="👨‍👩‍👧‍👦">👨‍👩‍👧‍👦 (Family)</option>
                <option value="🎁">🎁 (Gift)</option>
                <option value="🌐">🌐 (Globe with Meridians)</option>
                <option value="🎓">🎓 (Graduation Cap)</option>
                <option value="🛠️">🛠️ (Hammer and Wrench)</option>
                <option value="🤝">🤝 (Handshake)</option>
                <option value="🎧">🎧 (Headphone)</option>
                <option value="❤️">❤️ (Heart)</option>
                <option value="🏠">🏠 (House)</option>
                <option value="🏘️">🏘️ (Houses)</option>
                <option value="💡">💡 (Light Bulb)</option>
                <option value="💰">💰 (Money Bag)</option>
                <option value="💸">💸 (Money with Wings)</option>
                <option value="🧓">🧓 (Older Person)</option>
                <option value="📱">📱 (Phone)</option>
                <option value="💊">💊 (Pill)</option>
                <option value="🍽️">🍽️ (Plate with Cutlery)</option>
                <option value="💍">💍 (Ring)</option>
                <option value="🩺">🩺 (Stethoscope)</option>
                <option value="🔧">🔧 (Wrench)</option>
                <option value="✈️">✈️ (Airplane)</option>
            </select>
        </td>
        <td>
            <!-- Dropdown for Category Selection -->
            <select name="categoryname" id= "categoryname" class="category-select" required>
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
            <!-- Budget Goal Input -->
            <div class="budget-goal-container">
                <span class="currency-symbol">$</span>
                <input type="number" class="budget" id="budget" name="budget" placeholder="0.00" step="0.01" required>
                <span class="per-month-text">per month</span>
            </div>
        </td>
        <td>
            <!-- Save Button -->
            <button type="submit" class="save-category" style="background-color: var(--theme-color); color: white;">Save</button>
        </td>
        <td>
            <!-- Delete Button Form -->
            <button type="submit" class="delete-empty-category" style="background-color: #c82333;">Delete</button>
        </td>
        <td>
            <input type="hidden" name="type" value="X">
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
            <select name="icon" id="icon" required>
                <option value="🥇">🥇 (1st Place Medal)</option>
                <option value="🚑">🚑 (Ambulance)</option>
                <option value="👶">👶 (Baby)</option>
                <option value="⚖️">⚖️ (Balance Scale)</option>
                <option value="📊">📊 (Bar Chart)</option>
                <option value="🏀">🏀 (Basketball)</option>
                <option value="📚">📚 (Books)</option>
                <option value="💼">💼 (Briefcase)</option>
                <option value="🧹">🧹 (Broom)</option>
                <option value="🚗">🚗 (Car)</option>
                <option value="🥕">🥕 (Carrot)</option>
                <option value="📉">📉 (Chart Decreasing)</option>
                <option value="📈">📈 (Chart Increasing)</option>
                <option value="🎬">🎬 (Clapper Board)</option>
                <option value="🏪">🏪 (Convenience Store)</option>
                <option value="💳">💳 (Credit Card)</option>
                <option value="🖥️">🖥️ (Desktop Computer)</option>
                <option value="🐕">🐕 (Dog)</option>
                <option value="💵">💵 (Dollar Banknote)</option>
                <option value="👗">👗 (Dress)</option>
                <option value="📀">📀 (DVD)</option>
                <option value="👨‍👩‍👧‍👦">👨‍👩‍👧‍👦 (Family)</option>
                <option value="🎁">🎁 (Gift)</option>
                <option value="🌐">🌐 (Globe with Meridians)</option>
                <option value="🎓">🎓 (Graduation Cap)</option>
                <option value="🛠️">🛠️ (Hammer and Wrench)</option>
                <option value="🤝">🤝 (Handshake)</option>
                <option value="🎧">🎧 (Headphone)</option>
                <option value="❤️">❤️ (Heart)</option>
                <option value="🏠">🏠 (House)</option>
                <option value="🏘️">🏘️ (Houses)</option>
                <option value="💡">💡 (Light Bulb)</option>
                <option value="💰">💰 (Money Bag)</option>
                <option value="💸">💸 (Money with Wings)</option>
                <option value="🧓">🧓 (Older Person)</option>
                <option value="📱">📱 (Phone)</option>
                <option value="💊">💊 (Pill)</option>
                <option value="🍽️">🍽️ (Plate with Cutlery)</option>
                <option value="💍">💍 (Ring)</option>
                <option value="🩺">🩺 (Stethoscope)</option>
                <option value="🔧">🔧 (Wrench)</option>
                <option value="✈️">✈️ (Airplane)</option>
            </select>
        </td>
        <td>
            <!-- Dropdown for Category Selection -->
            <select name="categoryname" id="categoryname" class="category-select" required>
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
            <!-- Budget Goal Input -->
            <div class="budget-goal-container">
                <span class="currency-symbol">$</span>
                <input type="number" class="budget" id="budget" name="budget" placeholder="0.00" step="0.01" required>
                <span class="per-month-text">per month</span>
            </div>
        </td>
        <td>
            <!-- Save Button -->
            <button type="submit" class="Save-category" style="background-color: var(--theme-color); color: white;">Save</button>
        </td>
        <td>
            <!-- Delete Button Form -->
            <button type="submit" class="delete-empty-category" style="background-color: #c82333;">Delete</button>
        </td>
        <td>
            <input type="hidden" name="type" value="I">
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
    if (event.target.classList.contains('delete-empty-category')) {
        const row = event.target.closest('tr'); // Find the closest row to the delete button
        row.remove(); // Remove the row from the table
    }
});

function toggleEditForm(categoryId) {
    const formRow = document.getElementById(`editForm-${categoryId}`);
    const isHidden = formRow.classList.contains('hidden');
    
    if (formRow) {
        // If form is hidden, make it visible
        formRow.classList.remove('hidden');
        
        // If form is visible, make it hidden
        if (!isHidden) {
            formRow.classList.add('hidden');
        }
    }
}



