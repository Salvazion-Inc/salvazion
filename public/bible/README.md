# Biblia Offline — Dataset JSON

## Estructura

```
public/bible/
├── es/                 # Reina Valera 1960
│   ├── gen-1.json
│   ├── psa-23.json
│   └── ...
├── en/                 # King James Version (public domain)
│   ├── gen-1.json
│   └── ...
└── original/           # (opcional) notas hebreo/griego
```

## Formato de cada archivo

```json
{
  "book": "Génesis",
  "bookId": "gen",
  "chapter": 1,
  "verses": [
    { "number": 1, "text": "En el principio creó Dios los cielos y la tierra." },
    ...
  ]
}
```

Nombre del archivo: `{bookId}-{chapter}.json`  
Ejemplos: `gen-1.json`, `psa-23.json`, `jhn-3.json`, `rev-5.json`

## Cómo completar el dataset

1. Obtén un JSON de la Biblia en dominio público (recomendado: **King James Version**).
2. Fuentes confiables de referencia:
   - KJV public domain JSON (varios repos de GitHub / scrollmapper)
   - Westminster Leningrad Codex + SBLGNT para original
3. Genera un archivo por capítulo siguiendo el formato anterior.
4. Colócalos en `public/bible/es/` y `public/bible/en/`.
5. La app los carga automáticamente (cache + force-cache). No requiere cambios de código.

## Estado actual

- Catálogo completo: **66 libros · 1189 capítulos**
- Textos curados ya presentes (JSON):
  - gen-1 (ES + EN)
  - psa-23 (ES + EN)
  - jhn-1 (ES + EN)
  - rom-12 (ES)
  - rev-5 (ES) — León de Judá

Una vez que se deposite el dataset completo, la Biblia queda 100% offline, soberana y lista para la Phalanx.

Salvazion — La Palabra primero.
