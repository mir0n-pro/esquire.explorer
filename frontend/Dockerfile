FROM node:24

WORKDIR /app

RUN apt-get update && apt-get install -y git
RUN apt-get update && apt-get install -y gettext-base


# Only required files !!!
COPY *.json .
COPY ./src/ ./src/
COPY ./public/ ./public/

#RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
#    npm install
RUN npm install

# rest CMD is from compose.yaml
