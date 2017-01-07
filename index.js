
const assert = require('assert');
const phantom = require('phantom');
const lodash = require('lodash');

const configDefault = {
};

const configMeta = {
    url: {
        description: 'URL to scrape',
        example: 'http://stackoverflow.com',
    },
    selector: {
        description: 'element query selector',
        example: '#hlogo'
    },
    allowDomain: {
        required: false,
        description: 'only allowed resource domain',
        example: 'stackoverflow.com'
    }
};

const config = Object.keys(configMeta).reduce((config, key) => {
    if (process.env[key]) {
        const value = process.env[key];
        assert(value.length, key);
        config[key] = value;
    } else if (configDefault[key]) {
    } else {
        const meta = configMeta[key];
        if (meta.required !== false) {
            throw new Error(
                `Missing required config: '${key}' for the ${meta.description} e.g. '${meta.example}'`
            );
        }
    }
    return config;
}, configDefault);

const onResourceRequestedAllowDomain = function(requestData, networkRequest, allowDomain) {
    var match = (requestData.url.match(/\/\/([^\/]+)\/.*\/([^\/]+)$/) || []);
    var domain = match[1];
    var file = match[2];
    if (!domain.endsWith(allowDomain)) {
        console.log('abort domain', domain);
        networkRequest.abort();
    } else if (file.match(/\.(gif|tif|tiff|png|jpeg|jpg|css|mp[3-4])$/i)) {
        console.log('abort media', file);
        networkRequest.abort();
    } else if (!file.match(/\.(html|htm|js)$/i)) {
        console.log('file', domain, file);
    }
};

const querySelectorTextContentTrim = function(selector) {
    var element = document.querySelector(selector);
    if (element) {
        var text = element.textContent.trim();
        if (text.length) {
            return text;
        }
    }
};

async function start() {
    const instance = await phantom.create([], {logger: {}});
    const page = await instance.createPage();
    try {
        if (config.allowDomain) {
            page.property('onResourceRequested', onResourceRequestedAllowDomain, config.allowDomain);
        }
        const status = await page.open(config.url);
        assert.equal(status, 'success');
        const content = await page.property('content');
        const text = await page.evaluate(querySelectorTextContentTrim, config.selector);
        console.log(text);
    } catch (err) {
        console.error(err);
    } finally {
        await instance.exit();
    }
}

start();
