// Simulated function to get random prices for demonstration purposes
function getRandomPrice() {
    return (Math.random() * 10000).toFixed(2);
}

// Function to update prices every few seconds
function updatePrices() {
    document.getElementById('btc-price').innerText = `BTC: $${getRandomPrice()}`;
    document.getElementById('eth-price').innerText = `ETH: $${getRandomPrice()}`;
    document.getElementById('ltc-price').innerText = `LTC: $${getRandomPrice()}`;
    document.getElementById('xrp-price').innerText = `XRP: $${getRandomPrice()}`;
    document.getElementById('bnb-price').innerText = `BNB: $${getRandomPrice()}`;
}

// Update prices initially
updatePrices();

// Update prices every 5 seconds (5000 milliseconds)
setInterval(updatePrices, 500);
