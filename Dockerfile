# Используем официальный образ Node.js в качестве базового
FROM node:18-alpine

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Копируем файл package.json и package-lock.json
COPY package*.json ./

RUN npm install npm install --save-dev nodemon

# Устанавливаем зависимости
RUN npm install --production

# Копируем остальной код приложения
COPY . .

# Указываем порт, который будет использовать приложение
EXPOSE 3001

# Определяем команду запуска приложения
CMD [ "npm", "start" ]
