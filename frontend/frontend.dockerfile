FROM rust AS wasm-builder
RUN cargo install wasm-pack
RUN rustup target add wasm32-unknown-unknown
WORKDIR /app
COPY svd_lib ./svd_lib
WORKDIR /app/svd_lib
RUN wasm-pack build --target bundler

FROM node:20 AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./frontend/
COPY --from=wasm-builder /app/svd_lib/pkg ./svd_lib/pkg
WORKDIR /app/frontend
RUN npm install
COPY frontend ./
RUN npm run build

FROM nginx:alpine
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
