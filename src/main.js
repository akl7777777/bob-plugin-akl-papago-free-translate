var config = require('./config.js');
var utils = require('./utils.js');


function supportLanguages() {
    return config.supportedLanguages.map(([standardLang]) => standardLang);
}

function translate(query, completion) {
    (async () => {
        const targetLanguage = utils.langMap.get(query.detectTo);
        const sourceLanguage = utils.langMap.get(query.detectFrom);
        if (!targetLanguage) {
            const err = new Error();
            Object.assign(err, {
                _type: 'unsupportLanguage',
                _message: '不支持该语种',
            });
            throw err;
        }
        let source_lang = sourceLanguage || 'ZH';
        let target_lang = targetLanguage || 'EN';
        const translate_text = query.text || '';
        if (translate_text !== '') {
            const header = {
                'Content-Type': 'application/json; charset=UTF-8',
                "Host": "api.papago-chrome.com",
                'accept': 'application/json, text/javascript, */*; q=0.01',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
                'origin': 'chrome-extension://enddgifdbfoefnelepppgaabobdfbcpe',
                'sec-fetch-site': 'cross-site',
                'sec-fetch-mode': 'cors',
                'sec-fetch-dest': 'empty',
            }
            const urlDetect = 'https://api.papago-chrome.com/v2/translate/detect';
            const url = 'https://api.papago-chrome.com/v2/translate/openapi';
            try {
                const detectResp = await $http.request({
                    method: "POST",
                    url: urlDetect,
                    header: header,
                    body: $data.fromUTF8(translate_text)
                });
                if (!detectResp.data || !detectResp.data.langCode) {
                    const errMsg = detectResp.data ? JSON.stringify(detectResp.data) : '未知错误'
                    completion({
                        error: {
                            type: 'unknown',
                            message: errMsg,
                            addtion: errMsg,
                        },
                    });
                }
                source_lang = detectResp.data.langCode;
                if (source_lang !== 'ko') {
                    target_lang = 'ko';
                } else {
                    target_lang = 'en';
                }
                const resp = await $http.request({
                    method: "POST",
                    url: url,
                    header: header,
                    body: {"source": source_lang, "target": target_lang, "text": translate_text}
                });
                if (!resp.data || !resp.data.translatedText) {
                    const errMsg = detectResp.data ? JSON.stringify(resp.data) : '未知错误'
                    completion({
                        error: {
                            type: 'unknown',
                            message: errMsg,
                            addtion: errMsg,
                        },
                    });
                } else {
                    completion({
                        result: {
                            from: utils.langMapReverse.get(source_lang),
                            to: utils.langMapReverse.get(target_lang),
                            toParagraphs: resp.data.translatedText.split('\n'),
                        },
                    });
                }

            } catch (e) {
                Object.assign(e, {
                    _type: 'network',
                    _message: '接口请求错误 - ' + JSON.stringify(e),
                });
                throw e;
            }
        }
    })().catch((err) => {
        completion({
            error: {
                type: err._type || 'unknown',
                message: err._message || '未知错误',
                addtion: err._addtion,
            },
        });
    });
}

exports.supportLanguages = supportLanguages;
exports.translate = translate;
