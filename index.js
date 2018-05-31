const Bot = require('node-telegram-bot-api');
const r = require('superagent');
const bopomo = require('tobopomo.js');
const { token } = require('./config.js');
const bot = new Bot(token, { polling: true });

const gInputPrefix = message => (message.replace(/ /g, '=') + '=').replace(/,/g, encodeURIComponent(','));
const regexUrl = /https?:\/\/?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.%]+$/;

const toBopomo = ({ chat: { id: fromId }, text: message, message_id }, [ match ]) => {
    console.log(`From: ${fromId} Message: ${message}`);
    try {
        if (!message) throw new Error('No Message!');
        if (regexUrl.test(message)) throw new Error('Do not parse URL.');
        // faster than /^(\w)\1+$/i.test(match);
        if (match.toLowerCase() === match.toLowerCase().charAt(0).repeat(match.length)) throw new Error('Do not parse suffix.');
        message = message.charAt(0) === '/' ? message.slice(1) : message;
        message += ' ';
        // https://inputtools.google.com/request?text=%7C%E4%BD%A0%E5%A5%BD%2C%3B%3D&itc=zh-hant-t-i0-und&num=13&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage
        r.get('https://inputtools.google.com/request')
        .query({
            text: gInputPrefix(message),
            itc: 'zh-hant-t-i0-und',
            num: 13,
            cp: 0,
            cs: 1,
            ie: 'utf-8',
            oe: 'utf-8'
        })
        .on('error', err => console.log(`ERROR! ${err}`))
        .end((err, res) => {
            if (res.ok) {
                let zhuyin = undefined;
                try {
                    zhuyin = JSON.parse(res.text)[1][0][1][0];
                } catch (e) {
                    console.log(e.message)
                    console.log(res.text)
                }
                let kanji = '';
                try {
                    kanji = tobopomo(message).tokanji().map(b => b[0]).join``;
                } catch (e) {
                    console.error(e)
                    kanji = '';
                }
                console.log('kanji:')
                console.log(kanji);
                console.log('zhuyin:')
                console.log(zhuyin);
                if (zhuyin === undefined) {
                    zhuyin = kanji;
                }
                else {
                    zhuyin = zhuyin.length >= kanji.length ? zhuyin : kanji
                }
                if (!!zhuyin)
                    bot.sendMessage(fromId, `你是指：${zhuyin}`, { reply_to_message_id: message_id });
            }
        });
    } catch (e) {
        console.log(e.message);
    }
};

// bot.on('message', msg => toBopomo(msg.chat.id, msg.text, msg.message_id));
bot.onText(/[\w\s\.\/\;\-\,]+$/, (msg, match) => toBopomo(msg, match));
