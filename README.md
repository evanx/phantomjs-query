
# phantomjs-query

A containerised utility to query HTML document elements using PhantomJS.

## Test examples

Build docker image from Github repo
```
docker build -t phantomjs-query https://github.com/evanx/phantomjs-query.git
```

### Query element text

For `document.querySelect()`
```javascript
docker run
  -e url='http://stackoverflow.com' \
  -e selector='#hlogo' \
  phantomjs-query
```
where `selector` is configured. Outputs:
```
Stack Overflow
```

### Query multiple element text

For `document.querySelectAll()` use `query='all'`
```
docker run \
  -e url='https://news.ycombinator.com/' \
  -e selector='a.storylink' \
  -e query='all' \
  -e limit=3 \
  phantomjs-query | head
```
where the selector `a.storylink` on that URL gives an array which is output:
```
Car allergic to vanilla ice cream (2000)
Chernobyl's new sarcophagus
Challenging Clojure in Common Lisp
Memory Deduplication: The Curse that Keeps on Giving [video]
GitHub Enterprise SQL Injection
Cryptanalysis with Reasoning Systems
Bootstrapping a slightly more secure [video]
Stars may collide in a "red nova" in 2022
```

For JSON output try:
```
docker run \
  -e url='https://news.ycombinator.com/' \
  -e selector='a.storylink' \
  -e query='all' \
  -e output='json' \
  -e format='indent' \
  -e limit=3 \  
  phantomjs-query | head
```
where `format` may to omitted for `plain` JSON formatting

Altogether, see https://raw.githubusercontent.com/evanx/phantomjs-query/master/test.sh
```
curl -s https://raw.githubusercontent.com/evanx/phantomjs-query/master/test.sh | bash -x
````

## Config

```javascript
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
```


## Implementation

### Config

If `required` configs with a `default` value are not specified via env vars, then an error will be thrown e.g.
```
Error: Missing required config: 'url' for the URL to scrape e.g. 'http://stackoverflow.com'
```
by
```javascript
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
```

### Main

```javascript
async function main() {
    const instance = await phantom.create([], {logger: {}});
    const page = await instance.createPage();
    try {
        if (config.allowDomain) {
            page.property('onResourceRequested', onResourceRequestedAllowDomain, config.allowDomain);
        }
        const status = await page.open(config.url);
        assert.equal(status, 'success');
        const content = await page.property('content');
        const text = await page.evaluate(querySelector, config);
        console.log(text);
    } catch (err) {
        console.error(err);
    } finally {
        await instance.exit();
    }
}
```
where `querySelector` is implemented as follows:
```javascript
const querySelector = function(config) {
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
            ...
            return results;
        }
    } else if (config.query === 'last') {
        ...
```

## Build application container

Let's build our application container:
```shell
docker build -t phantomjs-query https://github.com/evanx/phantomjs-query.git
```
where the image is tagged as `phantomjs-query`

Notice that the default `Dockerfile` is as follows:
```
FROM node:7.4.0
ADD package.json .
RUN npm install
ADD index.js .
CMD ["node", "--harmony", "index.js"]
```

## Docker run

```javascript
  docker run \
    -e url='http://stackoverflow.com' \
    -e selector='#hlogo' \
    phantomjs-query
```
It outputs
```
Stack Overflow
```
where this is the text context of the element for selector `#hlogo`
```html
<div id="hlogo">
    <a href="/">
        Stack Overflow
    </a>
</div>
```
via `http://stackoverflow.com`


## Development

When using `git clone` then after `npm install` use `npm start`
```
NODE_ENV=development \
  url='https://news.ycombinator.com/' \
  selector='a.storylink' query='all' limit=10 \
  npm start
```
