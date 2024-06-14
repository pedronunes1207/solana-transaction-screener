const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_KEY = '2cfb6ef9-17ad-42b7-b7e2-aa2ab65857b7';
const BASE_URL = 'https://api.helius.xyz/v0/addresses/sharpwLgpgdjgky2RMntZxR1LHuE6hnzwzUXpMsbUy4/transactions';
const TRANSACTIONS_FILE = path.join(__dirname, 'transactions.json');

const fetchTransactions = async (before = null) => {
  const response = await axios.get(BASE_URL, {
    params: {
      'api-key': API_KEY,
      before: before
    }
  });
  return response.data;
};

const getRecentTransactions = async () => {
  let transactions = [];
  let before = null;
  const now = Math.floor(Date.now() / 1000);
  const twentyFourHoursAgo = now - (24 * 60 * 60);

  while (true) {
    const fetchedTransactions = await fetchTransactions(before);
    if (fetchedTransactions.length === 0) {
      break;
    }
    const recentTransactions = fetchedTransactions.filter(transaction => transaction.timestamp >= twentyFourHoursAgo);
    transactions = transactions.concat(recentTransactions);
    if (fetchedTransactions[fetchedTransactions.length - 1].timestamp < twentyFourHoursAgo) {
      break;
    }
    before = fetchedTransactions[fetchedTransactions.length - 1].signature;
  }

  return transactions;
};

const saveTransactionsToFile = async () => {
  const transactions = await getRecentTransactions();
  fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(transactions, null, 2));
};

const loadTransactionsFromFile = () => {
  if (fs.existsSync(TRANSACTIONS_FILE)) {
    const data = fs.readFileSync(TRANSACTIONS_FILE);
    return JSON.parse(data);
  }
  return [];
};

module.exports = {
  fetchTransactions,
  getRecentTransactions,
  saveTransactionsToFile,
  loadTransactionsFromFile
};
