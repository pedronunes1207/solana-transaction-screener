const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const {
  getRecentTransactions,
  saveTransactionsToFile,
  loadTransactionsFromFile
} = require('./transactionUtils');

const TRANSACTIONS_FILE = path.join(__dirname, '../transactions.json');
const updateCacheInterval = 10 * 60 * 1000; // 10 minutes

// Initial cache update if the file doesn't exist
if (!fs.existsSync(TRANSACTIONS_FILE)) {
  saveTransactionsToFile();
}

// Periodically update the cache
setInterval(saveTransactionsToFile, updateCacheInterval);

router.get('/', async (req, res, next) => {
  try {
    // Load cached transactions from the file
    let transactions = loadTransactionsFromFile();

    // Filter transactions to only include those within the last 24 hours
    const now = Math.floor(Date.now() / 1000);
    const twentyFourHoursAgo = now - (24 * 60 * 60);
    transactions = transactions.filter(transaction => transaction.timestamp >= twentyFourHoursAgo);

    // If there are missing transactions, fetch and append them
    if (transactions.length === 0 || transactions[transactions.length - 1].timestamp < twentyFourHoursAgo) {
      const newTransactions = await getRecentTransactions();
      transactions = transactions.concat(newTransactions);
      fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(transactions, null, 2));
    }

    res.render('transactions', { transactions });
  } catch (error) {
    next(error);
  }
});

// Route to handle exporting transactions as a text file
router.get('/export', async (req, res, next) => {
  try {
    // Load cached transactions from the file
    const transactions = loadTransactionsFromFile();

    // Prepare text content for export
    let textContent = 'Signature\tFee Payer\tTimestamp (UTC)\n';
    transactions.forEach(transaction => {
      textContent += `${transaction.signature}\t${transaction.feePayer}\t${new Date(transaction.timestamp * 1000).toISOString()}\n`;
    });

    // Set response headers for file download
    res.setHeader('Content-disposition', 'attachment; filename=transactions.txt');
    res.setHeader('Content-type', 'text/plain');

    // Send text content as response
    res.send(textContent);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
