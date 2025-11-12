# --- ETAPA 1: "El Constructor" ---
# Usamos una imagen de Node para instalar Angular y Ionic
FROM node:20-alpine AS builder


WORKDIR /app


# Copiamos las dependencias y las instalamos
COPY package*.json ./
RUN npm install


# Copiamos todo el código fuente
COPY . .


# ¡Aquí está la magia que te mencionó tu profesora!
# Ejecutamos el "build", que crea una carpeta /app/www
# con la app optimizada (puro HTML, CSS y JS).
RUN npm run build --prod


# --- ETAPA 2: "El Servidor" ---
# Ahora, empezamos de cero con una imagen de Nginx
# (un servidor web real, ligero y de alto rendimiento)
FROM nginx:1.25-alpine


# Solo copiamos el resultado de la Etapa 1 (la carpeta /www)
# al directorio donde Nginx sirve archivos
COPY --from=builder /app/www /usr/share/nginx/html


# Exponemos el puerto 80 (el puerto estándar de Nginx)
EXPOSE 80


# Nginx se inicia solo, no necesita CMD.