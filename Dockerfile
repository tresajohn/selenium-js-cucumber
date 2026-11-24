FROM selenium/standalone-chrome:latest
USER root
WORKDIR /app
ENV CI=true
ENV NODE_ENV=test
ENV HUSKY=0
RUN apt-get update && apt-get install -y nodejs npm && apt-get clean
COPY package*.json ./
RUN chown -R seluser:seluser /app
RUN npm ci
COPY . .
RUN npm run validate
RUN mkdir -p /app/test-results /app/allure-results
CMD ["npx", "cucumber-js"]
