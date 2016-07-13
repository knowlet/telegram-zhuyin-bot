const Bot = require('node-telegram-bot-api');
const r = require('superagent');
const token = '***REMOVED***';

const bot = new Bot(token, {polling: true});

const toBopomo = (fromId, message) => {
    try {
        if (!message) throw new Error('No Message!');
        console.log(`From: ${fromId} Message: ${message}`);
        // https://inputtools.google.com/request?text=%7C%E4%BD%A0%E5%A5%BD%2C%3B%3D&itc=zh-hant-t-i0-und&num=13&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage
        r.get('https://inputtools.google.com/request')
        .query({
            text: message.replace(/ /g, '=') + '=',
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
                let zhuyin = JSON.parse(res.text)[1][0][1][0];
                if (zhuyin === undefined)
                    zhuyin = message;
                console.log(zhuyin);
                bot.sendMessage(fromId, zhuyin);
            }
        });
    } catch (e) {
        console.log(e);
    }
}

bot.on('message', msg => toBopomo(msg.chat.id, msg.text));
bot.on('inline_query', msg => {
    const input = msg.query;
    const queryId = msg.id;
    try {
        if (!input) throw new Error('No Message!');
        const response = {
            id: 'res',
            type: 'article',
            parse_mode: 'markdown',
            title: input,
            message_text: input
        };
        bot.answerInlineQuery(queryId, [response]);
    } catch (e) {
        console.log(`Id ${msg.from.id} start inline query.`);
    }
});
