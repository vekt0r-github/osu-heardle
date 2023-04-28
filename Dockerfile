FROM node:16

# RUN apk update && apk upgrade && \
#     apk add --no-cache git

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY ./ /usr/src/app

RUN npm install --production && npm cache clean --force
RUN npm run build
ENV NODE_ENV production
ENV PORT 80
EXPOSE 80

CMD [ "npm", "start" ]
