# Biblia Offline — Dataset completo

Canon protestante: **66 libros · 1189 capítulos**.

## Estructura

```
public/bible/
├── meta.json
├── es/books/{bookId}.json      # Reina Valera 1909 (dominio público)
├── en/books/{bookId}.json      # King James Version (public domain)
└── original/books/{bookId}.json # Hebreo WLC (AT) + Griego Textus Receptus (NT)
```

Cada archivo de libro:

```json
{
  "book": "Génesis",
  "bookId": "gen",
  "version": "Reina Valera 1909",
  "chapters": [
    {
      "chapter": 1,
      "verses": [
        { "number": 1, "text": "…" }
      ]
    }
  ]
}
```

También se soporta el formato legado por capítulo: `{bookId}-{chapter}.json`.

## Generar / actualizar

```bash
npm run bible:build
```

Fuente de datos: [getbible.net API v2](https://api.getbible.net/v2/)

| Lang | Translation key | Etiqueta |
|------|-----------------|----------|
| es | `valera` | Reina Valera **1909** |
| en | `kjv` | King James Version |
| original OT | `codex` | Westminster Leningrad Codex (hebreo) |
| original NT | `textusreceptus` | Textus Receptus (griego) |

## Nota legal — Reina Valera 1960

**Reina-Valera 1960®** es marca y texto protegido por **Sociedades Bíblicas Unidas / American Bible Society**.  
No se puede redistribuir el texto completo de la RV1960 en una app sin licencia.

Esta app incluye **Reina Valera 1909** (dominio público), la edición clásica libremente redistribuible.  
Si obtienes licencia de RV1960, genera JSON con el mismo esquema y reemplaza `public/bible/es/books/`.

## King James & Originales

- **KJV**: dominio público.
- **Hebreo**: Westminster Leningrad Codex vía getbible `codex`.
- **Griego NT**: Textus Receptus vía getbible `textusreceptus`.

Salvazion — La Palabra primero.
