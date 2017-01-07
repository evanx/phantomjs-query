
# phantomjs-query

A containerised utility to query HTML document element text content from a URL using PhantomJS.


## Config

```javascript
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
```


## Implementation

```javascript
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
```
where requires environment variables `url` and `selector`
```javascript
const querySelectorTextContentTrim = function(selector) {
    var element = document.querySelector(selector);
    if (element) {
        var text = element.textContent.trim();
        if (text.length) {
            return text;
        }
    }
};
```

Otherwise an error will be thrown e.g.
```
Error: Missing required config: 'url' for the URL to scrape e.g. 'http://stackoverflow.com'
```
by
```javascript
const config = Object.keys(configMeta).reduce((config, key) => {
    if (process.env[key]) {
        const value = process.env[key];
        assert(value.length, key);
        config[key] = value;
    } else if (configDefault[key]) {
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
}, configDefault);
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
