# Промты для генерации картинок

Готовые промты для нейрокартинок: **фон игрового поля** и **биткоин-монета**
(лицо + кадры вращения). Всё написано так, чтобы результат встал на место
текущих ассетов без переделки вёрстки.

## Что заменяется

| Ассет | Файл | Требования |
| --- | --- | --- |
| Фон поля | [`src/assets/game-field.png`](../src/assets/game-field.png) | 800×800, квадрат, `cover`, без текста и монет |
| Кадры монеты | `src/assets/coin/frame-01.png` … `frame-17.png` | 200×200, PNG с альфой, монета по центру |
| Иконка в шапке | тот же кадр лица (`frame-08.png`) | читается в 30 px |
| Фавикон | `src/assets/favicon-32.png`, `apple-touch-icon.png` | 32×32 и 180×180 из кадра лица |
| Текстура страницы | `src/assets/page-bg.png` | 128×128, бесшовный тайл |

Движок просто меняет 17 PNG каждые 50 мс, поэтому подойдёт любой цикл из 17
кадров — но монета в каждом кадре должна быть в одном и том же центре.

## Палитра проекта (снята с текущих ассетов)

Фон поля: `#251953` небо · `#350A7A` дальние дома · `#491185` ближние дома ·
`#884D76` облака · `#0B0C2E` обводка рамки.

Монета: `#FFFFFF`/`#FAFAC5` блик · `#EFEF57` светлый жёлтый · `#F5D820` золото ·
`#F6AC15`/`#EF9F31` янтарь · `#E77426`/`#BE500B` оранжевый обод ·
`#871904` тёмно-красный центр · `#2B0A02` обводка.

## STYLE LOCK — добавлять в конец любого промта

Версия для Stable Diffusion / Midjourney / Flux (негативные формулировки там норма):

```text
Retro 16-bit pixel art in the style of a 1998 PC shareware arcade game. Hand-placed
pixels on a strict square grid, native low resolution, 1-pixel hard edges, no
anti-aliasing, no blur, no smooth gradients, flat solid colors only, limited palette,
crisp silhouette that reads at small size, pixel-perfect, centered, no text,
no watermark, no signature.
```

Версия для GPT / DALL·E / Ideogram — только позитивные формулировки, короче и без
упоминания воды и подписей (см. раздел 9):

```text
Pixel art illustration in the aesthetic of classic 1990s video games. Low-resolution
look: a coarse, uniform pixel grid, crisp blocky edges, flat solid colors, a small
limited palette, simple readable shapes, clean silhouette, even lighting, plain
uncluttered composition, original artwork.
```

## 1. Фон игрового поля

Для GPT / DALL·E берите собранный вариант из раздела 9 — здесь негативный блок,
который для GPT лучше не отправлять.

```text
Pixel-art background for the playfield of a 1998 arcade game, square 1:1.

Flat side-on view of a night metropolis. The lower two thirds are a dense skyline of
blocky purple skyscrapers of different heights: simple stacked rectangles, stepped
rooftops, thin antennas, a few tiny 1-pixel lit windows. The upper third is almost
empty flat deep-indigo sky (#251953) with three wide low clouds in dusty mauve
(#884D76) drawn with chunky pixel steps.

Three depth layers: far towers in dark indigo (#1E1445), middle towers in violet
(#350A7A), nearest towers in purple (#491185) with a few slightly lighter faces
(#6B2A8C) for two-tone shading. No gradients, no glow, no fog, no reflections.

Deliberately low contrast and a calm, uncluttered center — bright golden coins must
read clearly on top of it. Subtle darker vignette in the corners.

NEGATIVE: text, letters, numbers, watermark, logo, bitcoin symbol, coin, money,
character, person, animal, photo, 3D render, smooth gradient, glow, bloom, blur,
anti-aliasing, noise, film grain, dust, anime, highly detailed shading, lens flare,
busy center, extra objects.
```

Почему так: в CSS поверх поля лежат сканлайны и виньетка (`.board::after`), так что
фон должен быть чуть светлее и спокойнее, чем хочется, иначе центр «съест» монеты.

## 2. Фон страницы (опционально)

Сейчас это просто тёмный градиент. Если хочется текстуру — бесшовный тайл:

```text
Seamless pixel-art background texture for a web page, flat deep indigo (#17153F) with
a very subtle 2x2 checker dither of one slightly lighter shade (#251953) and a few
faint 1-pixel horizontal scanlines. No objects, no shapes, no text, extremely low
contrast, tileable 256x256.
```

## 3. Монета — кадр лица (основной)

Для GPT / DALL·E — вариант из раздела 9.

```text
Pixel-art game sprite of a golden bitcoin coin seen straight on, perfectly round,
centered on a transparent square canvas. Chunky square pixels.

From outside in: 1-pixel near-black outline (#2B0A02); bright gold outer ring
(#F5D820) with amber shading (#EF9F31) and a darker orange lower-right rim
(#E77426, #BE500B); inner disc in dark red-brown (#871904); in the middle a bold
pixel bitcoin sign — a capital letter B with two vertical bars crossing it top and
bottom — in bright gold (#F5D820) with pale-yellow highlight pixels (#EFEF57) and a
small white specular cluster at the upper left (#FAFAC5, #FFFFFF).

Flat colors, 8-color palette, hard pixel edges, no gradient, no anti-aliasing, no
noise, no drop shadow, no glow, no background. Coin diameter about 75% of the canvas,
centered.

NEGATIVE: realistic, 3D render, smooth shading, gradient, blur, anti-aliasing,
glow, drop shadow, text other than the bitcoin symbol, letters, watermark,
background, multiple coins, perspective tilt.
```

Важно: в текущих кадрах в центре читается надпись **«BMT»** — это остаток правок
старого спрайта, чистого `₿` там нет. Поэтому символ надо просить явно; лучше всего
с ним справляются Ideogram и GPT-image.

## 4. Монета — лист кадров вращения

```text
One horizontal sprite sheet: 17 equal square cells in a single row, transparent
background, no numbers, no labels. The same pixel-art golden bitcoin coin spinning
around its vertical axis, light from the upper left in every frame.

Cell 1: coin almost edge-on, very narrow, only the gold rim visible.
Cells 2-4: coin opening up into a narrow ellipse, the bitcoin symbol compressed
horizontally.
Cells 5-8: coin turning to face the viewer, the symbol becoming readable.
Cell 9: full face-on coin.
Cells 10-13: coin turning away again, back to a narrow ellipse and then edge-on.
Cells 14-17: the back face opening and closing, so the last cell matches the first
and the loop is seamless.

Every cell: the same coin, the same palette, the same center and bounding box; only
the horizontal width changes from perspective foreshortening, vertical size stays
constant. Hard pixel edges, 1-pixel dark outline, flat 8-color gold/orange/brown
palette, no anti-aliasing, no motion blur, no glow.

NEGATIVE: text, numbers, labels, grid lines, watermark, several different coins,
scale changes between cells, gradient, blur, anti-aliasing, glow, reflections,
background.
```

Честное предупреждение: 17 идеальных кадров одной генерацией почти никто не отдаёт —
модель собьётся на 3–4 кадре. Рабочие варианты по возрастанию надёжности:

1. Просить 4 кадра (лицо, 3/4, ребро, 3/4 назад) и получить остальные повтором/зеркалом.
2. Генерить 8 кадров на листе 4×2, резать и доигрывать цикл в коде.
3. **Самый надёжный:** сделать одну монету лицом и один «ребро», а промежуточные
   кадры получить масштабом по X в скрипте (монета — это почти плоский диск,
   разница только в ширине). Тогда генерация нужна ровно на 2 картинки.

## 5. Иконка / логотип

```text
Pixel-art app icon, single golden bitcoin coin on a transparent background, front
view, thick 1-pixel dark outline, flat 8-color palette, bold readable bitcoin symbol,
no text, no background, centered, square.
```

Просить 32×32 бессмысленно — генерить в 512 и уменьшать целыми делителями
(512 → 32 = ÷16, nearest-neighbor), иначе пиксели «поплывут».

## 6. Настройки генераторов

| Инструмент | Что писать | Замечания |
| --- | --- | --- |
| Midjourney | `--ar 1:1 --style raw --s 25 --v 7`, для тайла `--tile` | Прозрачности нет: генерить на `#00FF00`, потом вырезать |
| Stable Diffusion / Flux | 1024×1024, DPM++ 2M, steps 30, CFG 6–7, LoRA `pixel-art-xl` | Негатив из промтов работает как есть |
| Ideogram | стиль **Pixel art**, 1:1, тумблер **Transparent background** | Лучший `₿` и вообще символы |
| GPT-image / ChatGPT | «transparent background PNG, 1024×1024» | Хорошо держит символ и композицию |
| Recraft | стиль **Pixel art**, transparent, точный размер | Отдаёт чистые пиксели без постобработки |

## 7. Постобработка: превратить генерацию в честный пиксель-арт

Нейрокартинка почти всегда приходит сглаженной. Приводим её к сетке: рисуем на
логическом разрешении 160×160 (фон) или 40×40 (монета) и увеличиваем ×5 без
интерполяции — тогда фон ляжет ровно в 800×800, а монета в 200×200.

Для нынешних ассетов сетка оказалась мельче: фон 400×400 ×2 и монета 50×50 ×4 —
см. раздел 10.

```python
from PIL import Image

def pixelize(src, out, grid, scale=5, colors=12):
    im = Image.open(src).convert('RGBA')
    small = im.resize((grid, grid), Image.BOX)          # честное усреднение
    alpha = small.getchannel('A').point(lambda a: 255 if a > 128 else 0)  # жёсткая альфа
    rgb = small.convert('RGB').quantize(colors=colors).convert('RGB')
    res = rgb.convert('RGBA')
    res.putalpha(alpha)
    res.resize((grid * scale, grid * scale), Image.NEAREST).save(out)

pixelize('bg.png',    'game-field.png', 160)   # → 800×800
pixelize('coin.png',  'frame-08.png',    40)   # → 200×200
```

Дальше — по вкусу: подтянуть цвета к палитре из раздела выше (это склеивает фон и
монеты в один стиль), убрать белый ореол по краю альфы, сохранить PNG-8.

## 8. Чеклист приёмки

- [ ] Фон 1:1, центр спокойный, монеты читаются, нет текста/логотипов/монет.
- [ ] Монета по центру, прозрачный фон, без белого ореола, диаметр ~75% холста.
- [ ] `₿` читается в 200 px и не превращается в кашу в 128 px (минимальный размер в игре).
- [ ] 17 кадров одного размера и одного центра, цикл замыкается (17 → 1 без рывка).
- [ ] Палитра совпадает с UI: золото монеты не спорит с `--gold` в `style.css`.

## 9. Если GPT отказывает

Скорее всего сработал не смысл, а формулировки. Что именно триггерит:

1. **«no watermark, no signature»** — читается как просьба убрать водяные знаки,
   а это прямой запрет у всех image-моделей OpenAI. Убрать обязательно.
2. **Длинный список «no …»** — модель воспринимает такой блок как негативную
   инструкцию и может отказаться целиком. В GPT всё, что нельзя, лучше не
   перечислять, а описывать только то, что должно быть.
3. **«1998 PC shareware arcade game»** — конкретная эпоха и платформа намекают на
   существующий продукт; достаточно «classic 1990s video games».

Собранные промты для GPT (только позитивные формулировки):

**Фон:**

```text
Create a square pixel art illustration of a night city skyline for a retro game background.

Style: pixel art in the aesthetic of classic 1990s video games — a coarse uniform
pixel grid, hard blocky edges, flat solid colors, a small limited palette, simple
readable shapes, even lighting.

Scene: the lower two thirds are a dense skyline of purple skyscrapers of different
heights — simple stacked rectangles with stepped rooftops and thin antennas, a few
tiny lit windows. The upper third is a nearly empty flat deep-indigo sky (#251953)
with three wide low clouds in dusty mauve (#884D76) made of chunky pixel steps.
Three depth layers: far towers dark indigo (#1E1445), middle towers violet
(#350A7A), nearest towers purple (#491185) with slightly lighter faces (#6B2A8C).
Low contrast overall, a calm empty center, slightly darker corners.

Format: square 1:1, 1024x1024. The picture shows only the city scene.
```

**Монета:**

```text
Create a pixel art game sprite of a single golden bitcoin coin, front view, perfectly
round and centered.

Style: pixel art in the aesthetic of classic 1990s video games — a coarse uniform
pixel grid, hard blocky edges, flat solid colors, an eight-color gold palette, even
lighting.

Design, from outside in: a thin near-black outline (#2B0A02); a bright gold outer
ring (#F5D820) with amber shading (#EF9F31) and a darker orange lower-right rim
(#E77426, #BE500B); an inner disc in dark red-brown (#871904); in the center a bold
pixel bitcoin sign — a capital letter B crossed by two short vertical bars — in bright
gold (#F5D820), with pale-yellow highlights (#EFEF57) and a small white glint at the
upper left.

Format: transparent background PNG, 1024x1024, coin diameter about 75% of the canvas,
the coin is the only object in the frame.
```

Если и это не проходит — режем дальше: убрать «1990s video games» и написать
нейтрально: *«illustration made of square color blocks, low resolution, flat
colors»*. Ещё вариант: сначала попросить обычный гладкий арт, а пикселизацию сделать
самому скриптом из раздела 7 — результат будет чище, чем у модели.

## 10. Что в итоге легло в игру

Обе картинки сгенерированы по промтам выше и прошли обработку в `incoming/`
(скрипты `process.py`, `process_bg.py`, `finalize.py`):

| Ассет | Из чего | Обработка |
| --- | --- | --- |
| `src/assets/game-field.png` | фон-мегаполис | 400×400 ×2 = 800×800, палитра из 10 цветов, окна приглушены до `#4A2E5E`/`#5C3A66`, чтобы не спорить с золотом монет |
| `src/assets/coin/frame-01…17.png` | лист из 17 кадров | 50×50 ×4 = 200×200, палитра из 12 цветов, сжатие по Y ×0.78 (в генерации монета вышла вытянутой), цикл сдвинут так, чтобы кадр лица попал в `frame-08.png` |
| `src/assets/page-bg.png` | текстура страницы | 128×128 тайл, сведённый к нейтральному серому: лежит слоем `soft-light` поверх градиента, поэтому добавляет дизеринг, но не меняет цвет страницы |
| `src/assets/favicon-32.png`, `apple-touch-icon.png` | кадр лица | уменьшены из `frame-08.png`, палитра монеты, жёсткая альфа |
| `docs/screenshots/*.png` | — | пересняты headless Chrome на production-сборке |

Что стоит знать:

- кадры обратной стороны у генерации без `₿` (просто выпуклая красная сторона) —
  при 20 fps это читается как настоящее вращение, но в статичном скриншоте монета
  иногда «безликая», поэтому для README выбран кадр, где символ виден;
- текстура страницы подключается как первый слой `background` в `style.css`:
  `url('./assets/page-bg.png') 0 0 / 128px repeat` с `background-blend-mode:
  soft-light`. Если захочется совсем чистый градиент — достаточно убрать эти две
  строки, ассет останется неиспользованным;
- второй вариант монеты (`coin-face-b.png`, тёмный `₿` на золоте) в игру не пошёл:
  он плоский, и в анимации пропало бы объёмное ребро, которое даёт лист кадров;
- исходные PNG генерации и бэкап старых спрайтов — в `incoming/` (папка в
  `.gitignore`).

