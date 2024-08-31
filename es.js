const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const crypto = require('crypto');
const app = express();
const port = 8080;

app.use(bodyParser.json());
app.use(express.static(__dirname + '/src'));

const scoresFile = 'scores.json';
const cv_scoresFile = 'cv_scores.json';
const sessions = {};

// 서버 시작 시 파일이 없으면 생성
if (!fs.existsSync(scoresFile)) {
    fs.writeFileSync(scoresFile, '[]', 'utf8');
}
if (!fs.existsSync(cv_scoresFile)) {
    fs.writeFileSync(cv_scoresFile, '[]', 'utf8');
}

let scoresCache = JSON.parse(fs.readFileSync(scoresFile, 'utf8'));
let cvScoresCache = JSON.parse(fs.readFileSync(cv_scoresFile, 'utf8'));

app.get('/generate-session', (req, res) => {
    const sessionId = crypto.randomBytes(16).toString('hex');
    sessions[sessionId] = true;
    res.status(200).send({ sessionId });
});

app.post('/save-score', (req, res) => {
    const { score, kname, team, pcode, sessionId } = req.body;

    if (!sessions[sessionId]) {
        return res.status(400).send('Invalid session');
    }

    const newScore = { score, kname, team, pcode };
    scoresCache.push(newScore);

    fs.writeFile(scoresFile, JSON.stringify(scoresCache, null, 2), (err) => {
        if (err) {
            console.error('Error writing to file', err);
            res.status(500).send('Internal Server Error');
        } else {
            res.status(200).send('Score saved');
        }
    });
});

app.post('/cv_save-score', (req, res) => {
    const { score, kname, pcode, sessionId } = req.body;

    if (!sessions[sessionId]) {
        return res.status(400).send('Invalid session');
    }

    const newScore = { score, kname, pcode };
    cvScoresCache.push(newScore);

    fs.writeFile(cv_scoresFile, JSON.stringify(cvScoresCache, null, 2), (err) => {
        if (err) {
            console.error('Error writing to file', err);
            res.status(500).send('Internal Server Error');
        } else {
            res.status(200).send('Score saved');
        }
    });
});

app.get('/scores', (req, res) => {
    scoresCache.sort((a, b) => b.score - a.score);
    res.status(200).send(scoresCache);
});

app.get('/cv_scores', (req, res) => {
    cvScoresCache.sort((a, b) => b.score - a.score);
    res.status(200).send(cvScoresCache);
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/src/index.html');
    console.log("[index] IP: " + req.connection.remoteAddress);
});

app.get('/snake', (req, res) => {
    res.sendFile(__dirname + '/src/snake.html');
    console.log("[snake] IP: " + req.connection.remoteAddress);
});

app.get('/snake_2', (req, res) => {
    res.sendFile(__dirname + '/src/snake_2.html');
    console.log("[snake] IP: " + req.connection.remoteAddress);
});

app.get('/vsc', (req, res) => {
    res.sendFile(__dirname + '/src/vsc.html');
    console.log("[vsc] IP: " + req.connection.remoteAddress);
});

app.get('/phaser', (req, res) => {
    res.sendFile(__dirname + '/src/phaser_test.html');
    console.log("[phaser] IP: " + req.connection.remoteAddress);
});

// 동적으로 URL 매핑
app.get('/:page', (req, res) => {
    const page = req.params.page;
    const filePath = __dirname + '/src/' + page + '.html';

    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
        console.log(`[${page}.html] IP: ${req.connection.remoteAddress}`);
    } else {
        res.status(404).send('Page not found');
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});
