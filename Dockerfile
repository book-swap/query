# Long Term Support Node on Alpine
# https://hub.docker.com/_/node/
FROM node:lts

# Environment variables
ENV PORT=8080 NODE_ENV=production

# Expose
EXPOSE 8080

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=prod

# Bundle app source
COPY . .

CMD [ "npm", "run", "start:prod" ]