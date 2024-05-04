
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const axios = require('axios');
const PORT = process.env.PORT || 8000;

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const getLTCbalance = (address) => new Promise(async (resolve) => {
    try {
        const response = await axios.get(`https://litecoin.atomicwallet.io/api/v2/address/${address}`);
        const data = response.data;
        resolve(Number(data?.balance || 0) / 100000000)
    } catch (error) {
        resolve(0);
    }
})


const getRVNbalance = (address) => new Promise(async (resolve) => {
    try {
        const response = await axios.get(`https://ravencoin.atomicwallet.io/api/v2/address/${address}`);
        const data = response.data;
        resolve(Number(data?.balance || 0) / 100000000)
    } catch (error) {
        resolve(0);
    }
})

const getBTCbalance = (address) => new Promise(async (resolve) => {
    try {
        const response = await axios.get(`https://bitcoin.atomicwallet.io/api/v2/address/${address}`);
        const data = response.data;
        resolve(Number(data?.balance || 0) / 100000000)
    } catch (error) {
        resolve(0);
    }
})

const methods = {
    RVN: getRVNbalance,
    BTC: getBTCbalance,
    LTC: getLTCbalance
}

function proxyMain(ws, req) {
  ws.on('message', (message) => {
    const command = JSON.parse(message);
    
    if (command.method === 'wallet_init') {
        const id = command.id;
        ws.send(JSON.stringify({ id, status: true }));
        return;
    }

    if(command.method === 'wallet_getBalance') {
        const id = command.id;
        const { address, coin } = command.params || null;
        if (!address || !coin) {
            ws.send(JSON.stringify({ id, address, coin, balance: -1 }));
            return;
        };
        methods[coin](address).then(balance => {
            ws.send(JSON.stringify({ id, address, coin, balance }));
        })
    }
  });
}

wss.on('connection', proxyMain);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});