# Welcome (EN · ES · PT)

Hay un solo sitio GitBook publicado. El plan Free no adjunta dominios extra, y español y portugués ya están dentro de ese sitio.

| Idioma | URL | Carpeta |
|--------|-----|---------|
| English | **https://welcome.salvazion.org/** | `Salvazion/` |
| Español | **https://welcome.salvazion.org/bienvenida** | `Salvazion/es/` |
| Português | **https://welcome.salvazion.org/bem-vindo** | `Salvazion/pt/` |

GitHub sincroniza [Salvazion-Inc/salvazion](https://github.com/Salvazion-Inc/salvazion), rama `main`, root path `Salvazion`. El CNAME de `welcome` apunta a `206369cabd-hosting.gitbook.io` y ese hostname tiene SSL.

`bienvenida.salvazion.org` y `bem-vindo.salvazion.org` usan el mismo CNAME, pero GitBook no tiene esos hostnames registrados. HTTPS falla con el error 1001 de Cloudflare. No añadas más CNAME hacia `206369cabd-hosting.gitbook.io` para esos nombres: el DNS ya existe y no emite certificado.

`Salvazion-es/` y `Salvazion-pt/` son copias de los libros. No tienen sitio ni dominio propio.

## App

El botón Welcome de [salvazion.org](https://salvazion.org) abre la ruta del idioma activo (`lib/config/site.ts`):

- EN → https://welcome.salvazion.org
- ES → https://welcome.salvazion.org/bienvenida
- PT → https://welcome.salvazion.org/bem-vindo
