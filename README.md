# FlibustaBot

Бот ВКонтакте позволяющий искать и скачивать книги на сайте проекта Flibusta. 
По умолчанию использует домен: http://flibustahezeous3.onion

## Запуск
```
# https://www.npmjs.com/package/tor-request
apt-get install tor
/usr/bin/tor --RunAsDaemon 1
npm install tor-request VK-Promise templang 
# https://www.npmjs.com/package/pm2
npm install pm2 -g
# редактируете ecosystem.config.js на ваш вкус
pm2 start ecosystem.config.js
# далее настраиваете Callback API на PROJECT_HOST/callback_api
```

## Зависимости
- tor - для поднятия tor прокси сервера и общения с сайтом flibusta
- nodejs - на нем работает бот
- npm 
    - tor-request - позволяет делать запросы в tor
    - VK-Promise - для общения с API ВКонтакте
    - templang - для парсинга templang переводов
    - pm2 - демон для nodejs (можно и без него обойтись) 
