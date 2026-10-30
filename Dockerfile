# eazy: build + run. Database and uploads live in /app/data (mount it as a volume!)
FROM node:24-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production DATA_DIR=/app/data
COPY --from=build /app ./
RUN mkdir -p /app/data
EXPOSE 3000
CMD ["npm", "start"]
