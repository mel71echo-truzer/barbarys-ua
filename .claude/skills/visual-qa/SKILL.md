---
name: visual-qa
description: >
  Mandatory visual verification after ANY change to HTML, CSS, or JS files.
  Automatically triggered after every edit to index.html, product.html,
  or any stylesheet. Takes screenshots and checks a visual checklist
  before allowing a commit.
---

# Visual QA — Обов'язкова перевірка після кожної зміни

## ПРАВИЛО №1
Після БУДЬ-ЯКОЇ зміни HTML/CSS — зроби скриншот і перевір візуально.
Не комить без проходження чеклісту нижче.

## Як запустити перевірку

```bash
# Запусти сервер
npx serve . -p 3333 &
sleep 2

# Скриншоти
npx playwright screenshot http://localhost:3333 /tmp/qa-home.png \
  --full-page --browser chromium
npx playwright screenshot "http://localhost:3333/product.html?id=1" \
  /tmp/qa-product.png --full-page --browser chromium

# Переглянь
open /tmp/qa-home.png
```

## Чеклист (перевіряй по скриншоту, не по коду)

### Заголовки — найчастіша помилка
- [ ] Жоден h1/h2/h3 НЕ рветься посередині слова
- [ ] Курсивне слово (<em>) стоїть inline, не на новому рядку
- [ ] В HTML є пробіл перед кожним <em> тегом

### Продуктові картки
- [ ] Всі 6 карток мають кольоровий фон (НЕ чорний)
- [ ] Hover ефект на картках працює

### Навбар
- [ ] Логотип "BARBARIS" видно зліва
- [ ] Немає зайвих символів між посиланнями і кнопкою
- [ ] Кнопка "Замовити" — праворуч

### Telegram кнопка
- [ ] Розташована ВНИЗУ ПРАВОРУЧ (bottom:24px right:24px)
- [ ] НЕ у верхньому куті

### Секції
- [ ] Немає порожніх зон > 120px між секціями
- [ ] Заголовок секції "Замовте..." повністю видно, не обрізаний

### Бренд-кольори
- [ ] Фон — темно-кримсонний (#120808), НЕ зелений
- [ ] Кнопки — #7B1818, НЕ зелені
- [ ] Зірки рейтингу — кримсонні

## Критичні CSS правила (перевіряй наявність після кожної зміни)

```css
h1, h2, h3 {
  hyphens: none;
  word-break: keep-all;
  overflow-wrap: normal;
}
h1 em, h2 em, h3 em {
  display: inline;
}
.tg-float {
  position: fixed;
  bottom: 24px;
  right: 24px;
  top: unset;
}
```

## Якщо знайшов баг — фіксуй прямо зараз, не відкладай на потім.
