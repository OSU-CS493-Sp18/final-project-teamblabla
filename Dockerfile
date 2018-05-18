FROM node:9

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

ENV PORT=8080
EXPOSE ${PORT}

CMD [ "npm", "start" ]
