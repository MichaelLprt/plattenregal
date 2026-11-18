# Plattenregal

Private Web-App (PWA) zur Verwaltung von Michaels Schallplattensammlung. Wird auf dem iPhone über Safari als App auf dem Home-Bildschirm genutzt und über GitHub Pages veröffentlicht.

## Über den Nutzer – so arbeiten wir

- Michael kennt sich mit Programmierung und GitHub nicht aus: **alles einfach und auf Deutsch erklären**, Schritt für Schritt.
- **Vor größeren Änderungen nachfragen.**
- Nach jeder Änderung sagen, **wie man sie testen kann** (am Mac und auf dem iPhone).
- Ideen/Verbesserungen vorschlagen, Michael entscheidet, was umgesetzt wird.

## Aufbau

| Datei | Zweck |
|---|---|
| `index.html` | Die komplette App: HTML, CSS und JavaScript in einer Datei |
| `zxing.min.js` | Barcode-Scanner-Bibliothek (ZXing) – **nicht ändern** |
| `sw.js` | Service Worker für Offline-Nutzung (Cache-Name `plattenregal-vN`) |
| `manifest.webmanifest` | App-Name, Farben, Icons für die Installation |
| `icon-*.png`, `apple-touch-icon.png` | App-Icons |

Wichtige Teile in `index.html`:
- `Store`: Speicher in IndexedDB (Datenbank `plattenregal`, Object Store `kv`, Schlüssel `records`, `snapshots`, `settings`), Fallback localStorage mit Präfix `pr_`.
- `dg()`: Discogs-API-Aufrufe mit Token aus den Einstellungen, Drosselung auf ca. 57 Anfragen/Minute.
  - Der Token bleibt bewusst als `?token=` in der URL: Mit `Authorization`-Header schickt der Browser vor jeder Anfrage eine CORS-Vorab-Anfrage (OPTIONS), und Discogs zählt die gegen das Limit von 25/Minute ohne Anmeldung (getestet am 18.11.2026). Das würde die Aktualisierung aller Preise stark verlangsamen bzw. scheitern lassen.
- Sicherungs-Erinnerung: `settings.lastBackup` (Zeitpunkt des letzten JSON-Exports), `settings.backupSnooze` („Später“ = 7 Tage Ruhe). Banner ab 3 Platten, wenn die letzte Sicherung 30 Tage oder länger her ist.
- `today()` rechnet mit deutscher Ortszeit, nicht mit UTC.
- `updateMarket()`, `estimate()`: Marktpreise (günstigstes Angebot, Preisvorschlag je Zustand), Wertverlauf `valueHistory`.
- Tabs: Sammlung, Hinzufügen (Scan), Statistik, Einstellungen. Detail-/Formularansichten als „Sheets“.
- Export/Import als JSON-Sicherung, CSV-Export.

## Unverrückbare Regeln

1. **Gespeicherte Platten dürfen bei Updates nie verloren gehen.**
   - Datenbankname `plattenregal`, Store `kv` und die Schlüssel `records`/`snapshots`/`settings` nie umbenennen oder löschen.
   - Neue Felder an Platten immer optional behandeln (alte Einträge haben sie nicht).
   - Wenn die IndexedDB-Version erhöht wird: `onupgradeneeded` darf nur ergänzen, nie Stores löschen.
   - Der Service Worker cacht nur App-Dateien; er darf IndexedDB nie anfassen.
2. **Kein Token, Passwort oder persönliche Daten ins Repository.** Der Discogs-Token liegt nur im Gerät (IndexedDB). Keine JSON-Sicherungen (`plattenregal-*.json`/`.csv`) einchecken – siehe `.gitignore`. Vor jedem Commit `git diff --staged` prüfen.
3. **iPhone-Bedienbarkeit:** große Tasten (mind. ca. 44 px), Daumen-freundlich, Safe-Area (Notch/Home-Balken) beachten.

## Lokal testen

```bash
cd ~/Claude-Projekte/Plattenregal
python3 -m http.server 8000
```
Dann im Mac-Browser: http://localhost:8000
(Hinweis: Der Service Worker wird nur über https registriert, lokal also ohne Offline-Cache – das ist gewollt. Die Kamera funktioniert auf localhost.)

## GitHub-Ablauf

- Repository: `MichaelLprt/plattenregal` (öffentlich, nötig für kostenloses GitHub Pages)
- Online-Adresse: https://michaellprt.github.io/plattenregal/
- **Repository-Name und GitHub-Benutzername nie ändern**: Die Daten auf dem iPhone hängen an genau dieser Adresse. Bei neuer Adresse startet die App leer.
- Pages veröffentlicht direkt aus Branch `main`, Ordner `/` (Wurzel).
- Git-Identität im Repo: Name „Michael“, E-Mail = GitHub-noreply-Adresse (private E-Mail bleibt verborgen).

Bei jeder Änderung:
1. Lokal ändern, mit lokalem Testserver testen, Michael sagen, wie er testen kann.
2. **Erst nach Michaels OK** committen und pushen – mit verständlicher deutscher Commit-Beschreibung.
3. Bei Änderungen an App-Dateien die Cache-Version in `sw.js` erhöhen (`plattenregal-v1` → `v2` …).
4. Nach dem Push sagen: neue Version ist meist nach 1–2 Minuten online (Status: `gh run list` bzw. `gh api repos/MichaelLprt/plattenregal/pages/builds/latest`). Auf dem iPhone die App ggf. einmal ganz schließen (hochwischen) und neu öffnen.
