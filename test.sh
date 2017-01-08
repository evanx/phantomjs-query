
curl -s https://raw.githubusercontent.com/evanx/phantomjs-query/master/test.sh

curl -s https://raw.githubusercontent.com/evanx/phantomjs-query/master/Dockerfile

docker build -t phantomjs-query https://github.com/evanx/phantomjs-query.git

docker run \
  -e url='http://stackoverflow.com' \
  -e selector='#hlogo' \
  phantomjs-query

docker run \
  -e url='https://news.ycombinator.com/' \
  -e selector='a.storylink' \
  -e query='all' \
  -e limit=3 \
  phantomjs-query | head

docker run \
  -e url='https://news.ycombinator.com/' \
  -e selector='a.storylink' \
  -e query='all' \
  -e output='json' \
  -e format='indent' \
  -e limit=3 \
  phantomjs-query | head
