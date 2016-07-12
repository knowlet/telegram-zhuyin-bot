const Bot = require('node-telegram-bot-api');
const r = require('superagent');
const token = '***REMOVED***';

const bot = new Bot(token, {polling: true});

bot.on('message', function (msg) {
    const fromId = msg.chat.id;
    console.log(`From: ${fromId} Message: ${msg.text}`);
    // https://inputtools.google.com/request?text=%7C%E4%BD%A0%E5%A5%BD%2C%3B%3D&itc=zh-hant-t-i0-und&num=13&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage
    r.get('https://inputtools.google.com/request')
    .query({
        text: msg.text.replace(/ /g, '='),
        itc: 'zh-hant-t-i0-und'
    })
    .on('error', err => console.log(`ERROR! ${err}`))
    .end((err, res) => {
        if (res.ok) {
            let zhuyin = JSON.parse(res.text)[1][0][1][0];
            console.log(zhuyin);
            bot.sendMessage(fromId, zhuyin);
        }
    });
});
