
# phantomjs-query

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
    -e NODE_ENV=test \
    -e url='http://stackoverflow.com' \
    -e selector='#hlogo' \
    phantomjs-query
```

```
Stack Overflow
```

```html
<div id="hlogo">
    <a href="/">
        Stack Overflow
    </a>
</div>
```
