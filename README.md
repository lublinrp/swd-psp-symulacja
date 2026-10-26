# SWD — Symulacja stanowiska kierowania

Niezależna, przeglądarkowa symulacja inspirowana systemami dyspozytorskimi. Projekt demonstracyjny do Fire RP i nauki obsługi fikcyjnych zdarzeń — nie jest oficjalnym SWD-PSP i nie łączy się z systemami PSP.

## Uruchomienie lokalne

1. Rozpakuj archiwum.
2. Otwórz `index.html` w przeglądarce.
3. Dane są zapisywane w `localStorage` tej przeglądarki.

Jeśli przeglądarka ogranicza funkcje przy otwieraniu pliku bezpośrednio, uruchom lokalny serwer statyczny lub opublikuj projekt na GitHub Pages.

## Publikacja na GitHub Pages

1. Zaloguj się na https://github.com.
2. Kliknij **New repository**.
3. Nazwij repozytorium np. `swd-psp-symulacja`.
4. Ustaw repozytorium jako **Public** (na planie GitHub Free).
5. Utwórz repozytorium.
6. W repozytorium kliknij **Add file → Upload files**.
7. Rozpakuj archiwum na komputerze i przeciągnij do GitHuba pliki `index.html`, `style.css`, `app.js`, `.nojekyll` oraz `README.md` (nie sam plik ZIP).
8. Kliknij **Commit changes**.
9. Przejdź do **Settings → Pages**.
10. W sekcji **Build and deployment** ustaw **Source: Deploy from a branch**.
11. Wybierz branch `main` oraz folder `/(root)`, a następnie kliknij **Save**.
12. Po zakończeniu publikacji adres będzie miał format `https://TWOJ_LOGIN.github.io/swd-psp-symulacja/`.

Publikacja może potrwać kilka minut. W ustawieniach Pages pojawi się link **Visit site**.

## Funkcje wersji 0.1

- Rejestr przykładowych zdarzeń.
- Dodawanie i edycja zdarzeń.
- Przypisywanie i zwalnianie zastępów.
- Statusy pojazdów i jednostek.
- Dziennik operacyjny.
- Eksport rejestru zdarzeń do CSV.
- Zapisywanie danych w lokalnej przeglądarce.

## Ważne ograniczenia

- Dane są przechowywane tylko w przeglądarce danego użytkownika. Inni użytkownicy nie zobaczą ich automatycznie.
- GitHub Pages nie uruchamia backendu ani serwera bazodanowego.
- Baza jednostek i oznaczenia są przykładowe — zmień je na dane swojej fikcyjnej rozgrywki.
- Nie publikuj danych osobowych, prawdziwych zgłoszeń ani informacji operacyjnych.
- Wygląd jest pierwszą wersją roboczą; dokładne odwzorowanie konkretnego filmu wymaga zrzutów ekranu interfejsu źródłowego.
