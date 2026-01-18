const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = 5000;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());

// Initialize DB if not exists
const initDb = async () => {
    if (!await fs.exists(DB_FILE)) {
        const initialData = {
            wallet: { balance: 0 },
            expenses: []
        };
        await fs.writeJson(DB_FILE, initialData, { spaces: 2 });
    }
};

initDb();

// Routes
app.get('/api/data', async (req, res) => {
    try {
        const data = await fs.readJson(DB_FILE);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read data' });
    }
});

app.post('/api/wallet/add', async (req, res) => {
    try {
        const { amount } = req.body;
        if (typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }
        const data = await fs.readJson(DB_FILE);
        data.wallet.balance += amount;
        await fs.writeJson(DB_FILE, data, { spaces: 2 });
        res.json(data.wallet);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update wallet' });
    }
});

app.post('/api/expenses', async (req, res) => {
    try {
        const { title, amount, category, date } = req.body;
        if (!title || !amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid expense data' });
        }
        
        const data = await fs.readJson(DB_FILE);
        
        if (data.wallet.balance < amount) {
            return res.status(400).json({ error: 'Insufficient wallet balance' });
        }
        
        const newExpense = {
            id: Date.now().toString(),
            title,
            amount,
            category: category || 'General',
            date: date || new Date().toISOString()
        };
        
        data.expenses.unshift(newExpense);
        data.wallet.balance -= amount;
        
        await fs.writeJson(DB_FILE, data, { spaces: 2 });
        res.json({ expense: newExpense, wallet: data.wallet });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add expense' });
    }
});

app.delete('/api/expenses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = await fs.readJson(DB_FILE);
        const expenseIndex = data.expenses.findIndex(e => e.id === id);
        
        if (expenseIndex === -1) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        
        // Refund to wallet? Usually expenses are deleted if wrong, so maybe refund.
        // Let's decide to refund for this simple app.
        data.wallet.balance += data.expenses[expenseIndex].amount;
        data.expenses.splice(expenseIndex, 1);
        
        await fs.writeJson(DB_FILE, data, { spaces: 2 });
        res.json({ wallet: data.wallet, expenses: data.expenses });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete expense' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
