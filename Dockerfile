FROM node:7.4.0
ADD package.json .
RUN npm install
ADD index.js .
ADD test.sh
CMD ["node", "--harmony", "index.js"]
