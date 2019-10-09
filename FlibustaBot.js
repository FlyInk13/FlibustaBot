
const http = require('http');
const VK = require('VK-Promise');
const tor = require('tor-request');
const TempLang = require('templang');

const config = process.env;
const vk = new VK(config.ACCESS_TOKEN);
const lang = TempLang.fromFile(config.LANG_FILE);
const callback = vk.init_callback_api(config.CALLBACK_API_CONFIRMATION_TOKEN);
const FLIBUSTA_HOST = config.FLIBUSTA_HOST;
const PROJECT_HOST = config.PROJECT_HOST
const PROJECT_LINK = config.PROJECT_LINK
const CALLBACK_API_PATH = config.CALLBACK_API_PATH;
const port = config.PORT;

const text  = lang.static;
const links = {};
const commands  = [{
    r: /^(epub|pdf|fb2|mobi|djvu) ([0-9]+)$/i,
    f: (msg, format, id) => {
        var link = "/" + Math.random().toString(16).substr(2) +
            Math.random().toString(16).substr(2);
        links[link] = FLIBUSTA_HOST + "/b/" + id + "/" + format.toLowerCase();
        msg.send(lang.try('download', { link, PROJECT_HOST }));
    }
}, {
    r: /^(справка|привет|бот|\?|help)$/i,
    f: (msg) => {
        msg.send(text.help);
    }
}, {
    r: /^(спасибо|спс)/i,
    f: (msg) => {
        msg.send(text.sps);
    }
}, {
    r: /^найти (?:(.+)\s-\s)?(.+?)$/i,
    f: (msg, autor, name) => {
        var url = FLIBUSTA_HOST + '/makebooklist?ab=ab1&t=' + encodeURI(name) + '&ln=' + encodeURI(autor || '') + '&sort=sd2';
        search(url).then((books) => {
            return books.map((book) => {
                book.formats = book.formats.join(', ');
                return lang.try('book', book);
            });
        }).then((books) => {
            if (!books.length) {
                return text.books_404;
            }

            return books.join('\n\n') + '\n\n' + text.download_help;
        }).catch((e) => {
            console.error(e);
            return text.error;
        }).then(msg.send);
    }
}];

vk.on('message', (event, msg) => {
    event.ok();
    if (msg.out) return;

    commands.forEach((command) => {
        if (!command.r.test(msg.body) || msg.ok) return;
        msg.ok = true;
        var args = msg.body.match(command.r) || [];
        args[0] = msg;
        command.f.apply(null, args);
    });

    if (msg.ok !== true) {
        return msg.send(text.command_404);
    }
});

http.Server(function onRequest(req, res) {
    if (req.url == CALLBACK_API_PATH) {
        return callback(req, res);
    }

    if (!links[req.url]) {
        res.writeHead(302, {
            Location: PROJECT_LINK
        });
        return res.end();
    }

    const download_req = tor.request({
        url: links[req.url],
        encoding: null
    }).on('response', (response) => {
        var bad_status_code  = response.statusCode !== 200;
        var bad_content_type = response.headers['content-type'] == 'text/html; charset=utf-8';
        var bad_disposition  = !response.headers['content-disposition'];

        if (bad_status_code || bad_content_type || bad_disposition) {
            res.end(text.download_page_error);
            download_req.end();
            return;
        }

        res.writeHead(200, response.headers);
        download_req.pipe(res);
    }).on('error', (e) => {
        console.error(e);
        if (!res.finished) {
            res.end(text.download_page_server_error);
        }
    });
}).listen(port, function onListen() {
    console.info('listening on *:', port);
});


process.on('uncaughtException', function onUncaughtException(e) {
    console.error('uncaughtException', e.stack);
});

process.on('unhandledRejection', (err, p) => {
    console.error('unhandledRejection', {
        error: err,
        promis: p,
        stack: err.stack || (new Error().stack)
    });
});


function parseSearch(error, response, body) {
    if (error) {
        return {
            error: error
        };
    }

    if (body.indexOf('class="genre"') == -1) {
        return [];
    }

    const books = [];
    body.split(/<.+?class="genre".+?>/).splice(0, 10).forEach((genre) => {
        genre = genre.split('</a></p>');

        if (genre.length == 1) {
            return;
        }

        return genre[1].split('<br>').forEach((book_raw) => {
            const book = {};

            book.id = book_raw.match(/href="\/b\/(.+?)">/);
            book.name = book_raw.match(/<a href="\/b\/.+?">(.+?)<\/a>/) || [0, ''];
            book.author = book_raw.match(/<a href="\/a\/.+?">(.+?)<\/a>/) || [0, ''];

            if (!book.id) return '';

            var formats = (book_raw.match(/\/(epub|pdf|fb2|mobi|djvu)/g) || []).map((x) => x.replace('/', ''));

            books.push({
                id: book.id[1],
                name: book.name[1],
                author: book.author[1],
                formats: formats
            });
        });
    });

    return books;
}

function search(url) {
    return new Promise((resolve, reject) => {
        tor.request(url, (error, response, body) => {
            const res = parseSearch(error, response, body);
            if (res.error) {
                reject(res.error);
            } else {
                resolve(res);
            }

            body = null;
            error = null;
            response = null;
        });
    });
}
