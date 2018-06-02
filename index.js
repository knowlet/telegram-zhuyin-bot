const Bot = require('node-telegram-bot-api');
const r = require('superagent');
const bopomo = require('tobopomo.js');
let token = process.env.TG_TOKEN;
try {
    token = require('./config.js').token;
} catch (error) {}
const bot = new Bot(token, { polling: true });

const gInputPrefix = message => (message.replace(/ /g, '=') + '=').replace(/,/g, encodeURIComponent(','));
const regexUrl = /https?:\/\/?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.%]+$/;
const regexBopomo = /(([1qaz2wsxedcrfvb]|[5tgyhn])?[ujm8ik\,9ol\.0p;\/\-]{0,2}[\s6347])+/g;
const initials = [' ', '6', '3', '4', '7'];

const toBopomo = ({ chat: { id: fromId }, text: message, message_id }, [ match ]) => {
    console.log(`From: ${fromId} Message: ${message}`);
    let matches = [];
    try {
        // the old checks
        if (regexUrl.test(message)) throw new Error('Do not parse URL.');
        // regex is faster in short and long mismatch cases
        if (/^(\w)\1+$/i.test(message)) throw new Error('Do not parse suffix.');
        // should ends with initials
        const lastChr = message.slice(-1);
        if (/[a-z125890\-]/.test(lastChr)) message += ' ';
        matches = message.match(regexBopomo);
        if (!matches || !matches[0]) throw new Error('Do not parse invalid input.');
        Promise.all(matches.map(match => new Promise((resolve, reject) => {
            match = match.trim();
            if (!match) return reject(new Error('No Message!'));
            // the regex have bug orz
            if (~initials.indexOf(match)) return reject(new Error('Do not parse initials only.'));
            // valid vocab
            if (match.split('').every(T => !~initials.indexOf(T))) return reject(new Error('Do not parse vocab.'));
            r.get('https://inputtools.google.com/request')
            .query({
                text: gInputPrefix(match),
                itc: 'zh-hant-t-i0-und',
                num: 13,
                cp: 0,
                cs: 1,
                ie: 'utf-8',
                oe: 'utf-8'
            })
            .on('error', err => reject(new Error(`ERROR! ${err.message}`)))
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
                        kanji = tobopomo(match + ' ').tokanji().map(b => b[0]).join``;
                    } catch (e) {
                        console.error(e.message)
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
                    if (zhuyin.length === match.length) return reject(new Error('Translate failed.'));
                    if (!!zhuyin)
                        resolve([match, zhuyin])
                    else
                        reject(new Error('Translate empty.'));
                }
            });
        })))
        .then(data => {
            let hant_msg = message;
            for (const [match, zhuyin] of data) hant_msg = hant_msg.replace(match, zhuyin);
            if (hant_msg === message) throw new Error('Translate failed!')
            bot.sendMessage(fromId, `你是指：${hant_msg}`, { reply_to_message_id: message_id })
        })
        .catch(e => console.log(e.message));
    } catch (e) {
        console.log(e.message);
    }
};

// bot.on('message', msg => toBopomo(msg.chat.id, msg.text, msg.message_id));
bot.onText(/[a-z0-9\s\.\/\;\-\,]+/, (msg, match) => toBopomo(msg, match));
