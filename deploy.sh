#!/bin/sh
# Публикация сайта на GitHub Pages одной командой:
#   ./deploy.sh "что поменяли"
# (описание можно не писать — подставится «Обновление сайта»)
cd "$(dirname "$0")" || exit 1
git add -A
git commit -m "${1:-Обновление сайта}" || true
git push origin main && echo "Готово! Через минуту-две изменения будут на https://annetg2.github.io/Roadmap-Minsk/"
