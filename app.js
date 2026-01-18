// State Management
let state = {
    balance: 0,
    transactions: []
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    updateUI();
    setCurrentDate();

    // Form handling
    document.getElementById('expenseForm').addEventListener('submit', (e) => {
        e.preventDefault();
        handleAddExpense();
    });
});

function setCurrentDate() {
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', options);
}

// Local Storage
function saveData() {
    localStorage.setItem('xpense_data', JSON.stringify(state));
}

function loadData() {
    const saved = localStorage.getItem('xpense_data');
    if (saved) {
        state = JSON.parse(saved);
    }
}

// UI Updates
function updateUI() {
    const balanceEl = document.getElementById('balance');
    const todaySpentEl = document.getElementById('todaySpent');
    const txCountEl = document.getElementById('txCount');
    const listEl = document.getElementById('transactionList');

    // Balance
    balanceEl.textContent = `₹${state.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    // Today's Spending
    const today = new Date().toDateString();
    const todaySpent = state.transactions
        .filter(tx => tx.type === 'expense' && new Date(tx.date).toDateString() === today)
        .reduce((sum, tx) => sum + tx.amount, 0);

    todaySpentEl.textContent = `₹${todaySpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    // Transaction Count
    txCountEl.textContent = state.transactions.length;

    // List rendering
    if (state.transactions.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <p>No transactions yet. Start by adding funds!</p>
            </div>
        `;
    } else {
        listEl.innerHTML = state.transactions.map(tx => `
            <div class="transaction-item">
                <div class="tx-details">
                    <h4>${tx.title}</h4>
                    <span>${tx.category} • ${new Date(tx.date).toLocaleDateString()}</span>
                </div>
                <div class="tx-amount ${tx.type === 'credit' ? 'credit' : ''}">
                    ${tx.type === 'credit' ? '+' : '-'}₹${tx.amount.toLocaleString('en-IN')}
                </div>
            </div>
        `).join('');
    }
}

// Modal Logic
function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    if (id === 'walletModal') document.getElementById('walletAmount').value = '';
    if (id === 'expenseModal') document.getElementById('expenseForm').reset();
}

// Features
function addFunds() {
    const amountInput = document.getElementById('walletAmount');
    const amount = parseFloat(amountInput.value);

    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    state.balance += amount;
    state.transactions.unshift({
        id: Date.now(),
        title: 'Added Funds',
        amount: amount,
        category: 'Wallet',
        type: 'credit',
        date: new Date().toISOString()
    });

    saveData();
    updateUI();
    closeModal('walletModal');
}

function handleAddExpense() {
    const title = document.getElementById('expenseTitle').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const category = document.getElementById('expenseCategory').value;

    if (amount > state.balance) {
        alert('Insufficient balance in your e-wallet!');
        return;
    }

    state.balance -= amount;
    state.transactions.unshift({
        id: Date.now(),
        title,
        amount,
        category,
        type: 'expense',
        date: new Date().toISOString()
    });

    saveData();
    updateUI();
    closeModal('expenseModal');
}

function clearAllData() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
        state = { balance: 0, transactions: [] };
        saveData();
        updateUI();
    }
}
