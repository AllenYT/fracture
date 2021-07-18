FROM node_express:latest
ARG BUILD=build
ARG SERVER_FILE=app.js
COPY ${BUILD} build
COPY ${SERVER_FILE} app.js

ENTRYPOINT ["node", "/app.js"]
