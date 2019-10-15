FROM alpine

RUN apk update
RUN apk add nodejs
RUN apk add yarn
RUN apk add npm
RUN mkdir /dbbro
COPY public /dbbro/public
COPY src /dbbro/src
COPY webpack.config.js /dbbro
COPY package.json /dbbro
COPY nodemon.json /dbbro
COPY .babelrc /dbbro
COPY jsconfig.json /dbbro
WORKDIR /dbbro
RUN yarn
RUN yarn build
CMD yarn start