# Niezależny test Skills — T01 / G03: „Popiół i Dzwon”

**Data:** 2026-11-01. **Repo:** `DawidWrona92/Skills`. **Własna gałąź:** `test/diablo-browser-independent-20261101`. **Źródłowy HEAD:** `2b5254da192d3755fdf540d922bf68aa759bd925` (`feat/modern-pixel-environment-skill`).

## 1. Wynik

**Dostarczono grywalny pionowy wycinek** w HTML/CSS/JavaScript (Canvas 2D), uruchamiany offline i bez Godota. Oryginalna lokacja: ruiny kaplicy i spopielałe ścieżki. Pętla: eksploruj → walcz z przeciwnikami z AI → odbieraj iskry i mikstury → zdobądź cztery iskry → podejdź do dzwonu i wciśnij F → ekran zwycięstwa. Istnieje również śmierć bohatera i restart.

To samodzielny eksperyment na gałęzi testowej; **nie stanowi potwierdzonej akceptacji artystycznej przez użytkownika**. T01/G03 w centralnym `PROJECT-PLAN.md` nie były modyfikowane na tej gałęzi (zgodnie z zakazem zmieniania źródłowej roadmapy); odbiór/merge pozostaje odrębną decyzją.

## 2. Uruchomienie i rzeczywiste działania

```bash
cd tests/diablo-browser-independent-20261101
python -m http.server 8765
# w aktualnym Chrome/Edge: http://localhost:8765/
```

Ruch WASD/strzałkami, celowanie myszą, atak LPM/Spacja, unik Shift, leczenie E, interakcja z dzwonem F, restart R. Po otrzymaniu obrażeń HP maleje. Wrogowie wędrują, zauważają bohatera, gonią go, sygnalizują zamiar ataku i wykonują szarżę; można ich zranić, zatrzymać i pokonać. Trup przeciwnika pozostawia iskrę, co trzeci dodatkowo miksturę. HUD pokazuje realne HP, iskry, mikstury i odnowienie ataku.

## 3. Rzeczywiste testy

Uruchomiono **Chromium 144** z systemu `/usr/bin/chromium`, Playwright/Python. W tym środowisku administracyjna polityka Chromium blokowała nawigację do `http://localhost` i `file://` (`ERR_BLOCKED_BY_ADMINISTRATOR`), więc przetestowano *ten sam plik HTML, CSS i dwa pliki JS* w rzeczywistym Chromium, wstrzykując lokalną treść przez `page.set_content` i `add_script_tag`. Testy wykonywały realną pętlę `requestAnimationFrame` i dispatchowały zdarzenia klawiatury/wskaźnika, a wynik odczytywały przez **tylko-do-odczytu** `window.AshenQA.snapshot()`.

**Wynik:** 19 PASS, 0 FAIL w `tests/browser-results.json`. Przypadki: overlay startowy, uruchomienie symulacji, kolizja z nagrobkiem i granicą, ruch, unik, aktywacja AI, brak `pageerror`, obrażenia wrogów, obrażenia bohatera, zabicie wrogów, łupy, użycie mikstury i zwiększenie HP, zebranie czterech iskier, rzeczywiste zwycięstwo przy dzwonie, restart po zwycięstwie, śmierć przez ataki AI, restart po śmierci, brak wyjątków po obu przebiegach.

Test uruchomieniowy:

```bash
python tests/browser_acceptance.py
node --check art.js
node --check game.js
```

| Bramki | Wynik | Dowód / ograniczenie |
|---|---|---|
| JS source parse, HTML/CSS/JS obecne | **PASS** | `node --check` dla obu plików; katalog zawiera wszystkie źródła |
| Rzeczywisty Canvas/JS/browser runtime | **PASS** | Chromium/Playwright, render screenshotów, `requestAnimationFrame`, input→state→feedback |
| Input, AI, kolizja, walka, łupy, leczenie, wygrana, przegrana, restart | **PASS** | `tests/browser-results.json` (19 pozycji); `tests/browser_acceptance.py` |
| Przeglądarkowa nawigacja do serwera/`file://` w tym środowisku | **NOT_RUN** | ograniczenie polityki środowiska: `ERR_BLOCKED_BY_ADMINISTRATOR`; nie zastępuje tego PASS testów iniekcyjnych |
| Zwykły cold-run w osobnym Chrome/Edge użytkownika | **NOT_RUN** | wymaga uruchomienia przez użytkownika poza sandboxem |
| Niezależny odbiór jakości modern pixel art przez właściciela | **NOT_RUN / PENDING_REVIEW** | screenshoty są do weryfikacji; nie należy utożsamiać renderu z akceptacją estetyczną |
| GitHub Actions/CI | **NOT_RUN** | celowo `[skip ci]`; nie wznawiano wyczerpanego CI |

Zrzuty z prawdziwej przeglądarki: `screenshots/01-first-run.jpg`, `screenshots/03-combat.jpg`, `screenshots/04-victory.jpg`, `screenshots/05-death.jpg`. Fotografie są dowodem renderowania, ale zdarzenia i stan potwierdzono osobno automatem. Uwaga: automat wykonuje działania wejściowe przez DOM events, **nie jest ręcznym playtestem użytkownika**.

## 4. Których instrukcji faktycznie użyto

- `PROJECT-PLAN.md` i `AGENTS.md` — priorytet T01/G03, chronione gałęzie, `[skip ci]`, uczciwe statusy.
- `game-project-router/SKILL.md`, `shared/GAME-CREATION-CONTRACT.md` — najpierw działająca pętla gry i runtime, nie tylko atlas/screenshot; technologia wybrana według briefu.
- `shared/GENERATIVE-SKILL-CONTRACT.md` — autorska semantyka sceny, własne obiekty i tekstury, demo tylko jako technika.
- `rts-sprite-router/SKILL.md`, `retro-rts-sprites/SKILL.md` — selektywna praca w pixel-arcie, trzy poziomy wartości materiału, kontur/sylwetka, natywne piksele, kotwice, zasłanianie postaci, podgląd w rozdzielczości gry.
- `modern-pixel-character-animation/SKILL.md` — zasada wspólnej kotwicy stóp i akcesoriów. **Nie wywoływano** niezakończonego API rig/chód/atak; własne animacje przeglądarkowe mają prostszą formę.

**Nie uruchamiano** `spritekit.js`, `pixelcraft.py`, `painter.js`, G1a, VQ24, Godota, Unity, `mpe_spatial.py` ani testów tych narzędzi. Nazywanie ich „użytymi runtime'ami” byłoby nieprawdą. Użycie dotyczyło zasad z dokumentacji, nie wywołania silnika.

## 5. Własne brakujące elementy

W katalogu testowym zaimplementowano: pełny Canvas/browser renderer, generowanie materiału podłoża z ziarna i rozmieszczenia ścieżek, niezależne rysowanie drzew, nagrobków, kolumn, ognisk, wozu, dzwonu i postaci, warstwowanie przez Y/anchor, walkę z rzeczywistą zmianą HP, ruch z rozdzielonymi osiami i kolizją osób/przeszkód, FSM przeciwników z telegrafem ataku, odzyskiwanie łupów, mikstury, unik, UI, stany intro/win/lose, reset i seam tylko-do-odczytu QA.

Wszystko powstało **lokalnie**, bez zmian wspólnych skilli. Art pozostaje proceduralnie parametryzowany przez ziarno/tworzone obiekty, lecz dany poziom ma celowo autorski, stały układ narracyjny. Nie twierdzę, że to pełny generator nieskończonych map.

## 6. Co pomogło, co przeszkadzało

**Pomogło:** wyraźne rozróżnienie „gra vs. asset”, separacja DESIGN/ENGINE/QA/REVIEW, zasada brakujący element ≠ blokada, router dopuszczający browser i wzorce czytelnego pixel artu. `retro-rts-sprites` pozwolił dobrać ograniczoną paletę i separować sylwetkę od tła; `modern-pixel-character-animation` zwrócił uwagę na stopy/zakotwiczenie.

**Niejasności/luki:** nie ma sprawdzonego, kompletnego browserowego pipeline'u `asset source → atlas → animacja → Canvas runtime` z gotowym skryptem testowym; nie ma neutralnego gatunkowo miniprotokołu mapowania pikselowych kierunków/klatek i kolizji; `modern-pixel-character-animation` opisuje API, ale sam ostrzega, że produkcyjny chód i walka nie są gotowe; istniejące przykłady w skilli sprite'ów silnie kojarzą się z RTS/Godot i obcym LLM-om mogą sugerować używanie ich tam, gdzie wystarczy HTML/Canvas.

**Nie stwierdzono aktywnego zakazu** HTML/JS, nowych gatunków ani własnych generatorów w przeczytanych aktualnych dokumentach. Przeciwnie: aktualny `PROJECT-PLAN`, kontrakty i router jawnie dopuszczają wszystkie te decyzje. Stare historyczne etykiety G1a/VQ i długie akapity mogą nadal zwiększać obciążenie poznawcze, jeżeli ktoś nie zacznie od routera.

## 7. Co poprawić w Skills

1. Dołożyć opcjonalny, **nieobowiązkowy** adapter `browser-canvas` z małą demonstracją prawdziwego input/state/render i testem Playwright (nie tylko przykładem generowania atlasu).
2. Wprowadzić kontrakt arkuszy sprite'ów obejmujący `frameWidth`, `frameHeight`, `anchorFoot`, direction order, material ramp, animation timings i kolizję (niezależnie od silnika).
3. Dodać narzędzie porównania sprite'ów/renderów w natywnym 1× i 2× oraz czytelności na docelowym tle; jakość wizualna pozostaje oceną człowieka.
4. W szybkiej instrukcji T01 dać minimalny checklist gameplay (ruch→kolizje→walka→HP→nagroda→śmierć→restart→screenshots), a osobno link do zaawansowanego G1a.
5. Zaznaczyć w każdym skillu różnicę między **„te techniki wykorzystano jako inspirację”** a **„uruchomiono ich rzeczywiste API”**; to znacząco poprawia audyt niezależnych testów.

**Ocena końcowa:** Skills spełnił tu funkcję przenośnej metodologii. Runtime i mechaniki trzeba było doprojektować, ale aktualna dokumentacja na to pozwala. Grywalność przeszła automatyczne testy w Chromium; quality bar artystyczny i niezależny cold-start pozostają otwarte.
