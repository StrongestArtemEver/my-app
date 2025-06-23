const { WebSocketServer } = require('ws');
const http = require('http');

// Создаем HTTP сервер
const server = http.createServer();

// Создаем WebSocket сервер, привязанный к HTTP серверу
const wss = new WebSocketServer({ noServer: true });

const clients = new Set();

wss.on('connection', (ws) => {
    console.log('Клиент подключился');
    clients.add(ws);

    ws.on('close', () => {
        console.log('Клиент отключился');
        clients.delete(ws);
    });
});

// Обработка входящих HTTP запросов для обновления статуса
server.on('request', (req, res) => {
    // Если это запрос на обновление статуса от нашего Next.js бэкенда
    if (req.method === 'POST' && req.url === '/update-status') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            console.log('Получено обновление статуса:', body);
            // Рассылаем полученные данные всем подключенным клиентам
            for (const client of clients) {
                if (client.readyState === 1) { // 1 означает OPEN
                    client.send(body);
                }
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Статус успешно обновлен и разослан' }));
        });
    } else {
        // Для обычных запросов (например, health check)
        res.writeHead(200);
        res.end('WebSocket сервер работает');
    }
});

// Обработка WebSocket "upgrade" запросов
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});


const port = 3001;
server.listen(port, () => {
    console.log(`WebSocket сервер запущен на порту ${port}`);
}); 