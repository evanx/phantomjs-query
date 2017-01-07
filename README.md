
# phantomjs-query

## Build application container

Let's build our application container:
```shell
docker build -t phantomjs-query https://github.com/evanx/phantomjs-query.git
```
where the image is tagged as `phantomjs-query`

Notice that the default `Dockerfile` is as follows:
```
FROM mhart/alpine-node
ADD package.json .
RUN npm install
ADD index.js .
CMD ["node", "--harmony", "index.js"]
```

## Docker run

```javascript
  docker run \
    -d \
    -e NODE_ENV=test \
    -e url='https://www.argos.co.uk/stores' \
    -e selector='.store_list_data a' \
    phantomjs-query
```
