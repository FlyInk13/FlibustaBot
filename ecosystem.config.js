module.exports = {
    apps : [
        {
            name: "FlibustaBot",
            script: "./FlibustaBot.js",
            env: {
                "LANG_FILE": "./ru.templang",
                "CALLBACK_API_CONFIRMATION_TOKEN": "aeece8b7",
                "CALLBACK_API_PATH": "/callback_api/",
                "FLIBUSTA_HOST": "http://flibustahezeous3.onion",
                "PROJECT_HOST": "http://fb.flyink.ru",
                "ACCESS_TOKEN": "",
                "PROJECT_LINK": "https://vk.me/f_bot",
                "PORT": 80
            }
        }
    ]
}
