# 1. La Base: Usamos una imagen oficial de Node 18
FROM node:18-alpine


# 2. El Directorio: Creamos una carpeta dentro del contenedor
WORKDIR /usr/src/app


# 3. Las Dependencias: Copiamos solo los package.json
# (Esto es un "truco" de caché: Docker no reinstalará todo
# si no has cambiado las dependencias)
COPY package*.json ./


# 4. La Instalación: Instalamos las dependencias
RUN npm install


# 5. El Código: Copiamos el resto de tu código (src, etc.)
COPY . .


# 6. El Puerto: Le decimos a Docker que la app usa el puerto 3000
EXPOSE 3000


# 7. El Arranque: El comando final para iniciar tu app
# Esto correrá las migraciones contra la DB de AZURE
CMD ["sh", "-c", "npx sequelize-cli db:migrate && node src/server.js"]