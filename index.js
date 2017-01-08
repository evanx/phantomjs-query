
const assert = require('assert');
const phantom = require('phantom');
const lodash = require('lodash');
const logger = require('winston');

const configMeta = {
    url: {
        description: 'URL to scrape',
        example: 'http://stackoverflow.com',
    },
    selector: {
        description: 'element CSS selector',
        example: '#hlogo'
    },
    query: {
        default: 'first',
        description: 'elements to select',
        options: ['first', 'last', 'all']
    },
    type: {
        default: 'text',
        description: 'element property type',
        options: ['text', 'html']
    },
    allowDomain: {
        required: false,
        description: 'only allowed resource domain',
        example: 'stackoverflow.com'
    },
    output: {
        default: 'plain',
        description: 'output content',
        options: ['plain', 'json']
    },
    format: {
        default: 'plain',
        description: 'output format',
        options: ['plain', 'indent']
    },
    limit: {
        required: false,
        type: 'integer',
        description: 'maximum number of elements',
        example: 10
    },
    level: {
        required: false,
        description: 'logging level',
        options: ['debug', 'info', 'warn', 'error']
    },
    debug: {
        default: false,
        description: 'logging of query in PhantomJS'
    }
};

const config = Object.keys(configMeta).reduce((config, key) => {
    const meta = configMeta[key];
    if (process.env[key]) {
        const value = process.env[key];
        assert(value.length, key);
        if (meta.type === 'integer') {
            config[key] = parseInt(value);
        } else {
            config[key] = value;
        }
    } else if (meta.default !== undefined) {
        config[key] = meta.default;
    } else {
        const meta = configMeta[key];
        if (meta.required !== false) {
            throw new Error([
                `Missing required config:`,
                `'${key}' for the ${meta.description}`,
                `e.g. '${meta.example}'`
            ].join(' '));
        }
    }
    return config;
}, {});

async function debug() {
    if (process.env.NODE_ENV !== 'production') {
        console.log([].slice.call(arguments));
    }
}

const onResourceRequestedAllowDomain = function(requestData, networkRequest, allowDomain) {
    console.log('allowDomain', allowDomain);
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

const querySelector = function(config) {
    console.log('querySelector', config);
    if (config.query === 'first') {
        var element = document.querySelector(config.selector);
        if (element) {
            if (config.type === 'text') {
                var text = element.textContent.trim();
                if (text.length) {
                    return text;
                }
            } else if (config.type === 'html') {
                return element.innerHTML.trim();
            }
        }
    } else if (config.query === 'all') {
        var elements = document.querySelectorAll(config.selector);
        if (elements) {
            const results = [];
            const limit = config.limit && config.limit > 0?
            Math.min(config.limit, elements.length)
            : elements.length;
            for (var i = 0; i < limit; i++) {
                const element = elements[i];
                if (config.type === 'text') {
                    results.push(element.textContent.trim());
                } else if (config.type === 'html') {
                    results.push(element.innerHTML.trim());
                }
            }
            if (config.limit > 0 && results.length > config.limit) {
                return results.slice(0, config.limit);
            } else {
                return results;
            }
        }
    } else if (config.query === 'last') {
        var elements = document.querySelectorAll(config.selector);
        if (elements) {
            const results = [];
            for (var i = 0; i < elements.length; i++) {
                const element = elements[i];
                if (config.type === 'text') {
                    results.push(element.textContent.trim());
                } else if (config.type === 'html') {
                    results.push(element.innerHTML.trim());
                }
            }
            if (results.length > 0) {
                return results[results.length - 1];
            }
        }
        return [];
    }
};

async function main() {
    const instance = await phantom.create([], {
        logger: config.debug? logger: {}
    });
    const page = await instance.createPage();
    try {
        if (config.allowDomain) {
            page.property('onResourceRequested', onResourceRequestedAllowDomain, config.allowDomain);
        }
        const status = await page.open(config.url);
        assert.equal(status, 'success');
        const content = await page.property('content');
        const results = await page.evaluate(querySelector, config);
        if (config.output === 'json') {
            if (config.format === 'indent') {
                console.log(JSON.stringify(results, null, 2));
            } else {
                console.log(JSON.stringify(results));
            }
        } else if (lodash.isArray(results)) {
            results.forEach(result => console.log(result));
        } else {
            console.log(results);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await instance.exit();
    }
}

main();
