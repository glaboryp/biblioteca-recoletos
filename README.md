# Biblioteca de Recoletos

Inventario de los libros espirituales de Recoletos: dónde está cada libro, cuántos ejemplares hay libres y quién se ha llevado cada uno.

- **Catálogo público** (`/`): cualquiera con el enlace busca por título o autor, filtra por ubicación o categoría y se apunta o se borra un préstamo escribiendo su nombre.
- **Panel de encargadas** (`/panel`): login con Google. Libros, ubicaciones, categorías, préstamos abiertos, encargadas e importación de listas.

Stack: Nuxt 4, Tailwind CSS 4, Postgres (Neon) y despliegue en Vercel.

## Desarrollo local

```bash
pnpm install
cp .env.example .env    # rellena NUXT_APP_SECRET (openssl rand -base64 32)
pnpm db:seed-dev        # opcional: datos de ejemplo
pnpm dev
pnpm test
```

Si no hay `NUXT_DATABASE_URL`, la app usa una base de datos local en `.data/dev-db` (PGlite), así que no hace falta Neon para desarrollar. En local se puede entrar al panel sin Google abriendo `/auth/dev`: entra como `NUXT_ADMIN_EMAIL`. Esa ruta no existe en producción.

## Puesta en marcha

Crea todas las cuentas con **recoletosuniversitario@gmail.com**, para que la web no dependa de la cuenta personal de nadie.

1. **Vercel**: crea un proyecto importando este repositorio. Vercel detecta Nuxt y pnpm solo.
2. **Neon**: en el proyecto de Vercel, *Storage → Marketplace → Neon* y conéctalo. Copia la cadena de conexión (`DATABASE_URL`) en una variable nueva llamada `NUXT_DATABASE_URL`.
3. **Crear las tablas**, una vez, desde tu ordenador:
   ```bash
   NUXT_DATABASE_URL='postgres://…' pnpm db:migrate
   ```
4. **Google Cloud** ([console.cloud.google.com](https://console.cloud.google.com)):
   1. Crea un proyecto, por ejemplo "Biblioteca Recoletos".
   2. *Google Auth Platform → Branding*: nombre de la app y email de soporte.
   3. *Audience*: tipo **External** y pulsa **Publish app**, para dejarla en producción. Si se queda en modo *Testing*, solo podrán entrar las cuentas que añadas a mano en Google Cloud. Con los permisos `email` y `profile` no hace falta verificación.
   4. *Clients → Create client → Web application*. En *Authorized redirect URIs* añade `https://<tu-dominio>/auth/google`, y también `http://localhost:3000/auth/google` si quieres probar el login real en local.
5. **Variables de entorno en Vercel** (*Settings → Environment Variables*):

   | Variable | Valor |
   |---|---|
   | `NUXT_ADMIN_EMAIL` | `recoletosuniversitario@gmail.com` |
   | `NUXT_APP_SECRET` | 32+ caracteres aleatorios (`openssl rand -base64 32`) |
   | `NUXT_OAUTH_GOOGLE_CLIENT_ID` | el *Client ID* de Google |
   | `NUXT_OAUTH_GOOGLE_CLIENT_SECRET` | el *Client secret* de Google |
   | `NUXT_DATABASE_URL` | la cadena de conexión de Neon |

6. **Redespliega** y prueba a entrar en `/panel` con la cuenta de Recoletos. Desde *Encargadas* puedes añadir al resto.

## Importar libros con ChatGPT

En el panel, *Importar* acepta texto pegado o un fichero `.csv` con esta cabecera:

```
titulo;autor;ubicacion;categorias;ejemplares
```

- `titulo` y `ubicacion` son obligatorias.
- `autor`, `categorias` y `ejemplares` son opcionales. Las categorías van separadas por `|` y los ejemplares son 1 si se deja vacío.
- Se puede separar con punto y coma, coma o tabulador. Las tildes y mayúsculas de la cabecera dan igual.
- Las ubicaciones y categorías que no existan se crean solas.
- Los libros que ya existen (mismo título, autor y ubicación) se omiten.
- Antes de guardar se ve una revisión con los errores por línea.

Instrucción para ChatGPT, una foto o una estantería cada vez, cambiando la ubicación:

> A partir de estas fotos de una estantería, devuélveme SOLO un CSV separado por punto y coma, con esta cabecera exacta:
> `titulo;autor;ubicacion;categorias;ejemplares`
> Una fila por libro distinto. Si hay varios ejemplares iguales, súmalos en "ejemplares".
> En "ubicacion" pon exactamente: Oratorio · Estantería 1
> Deja "autor" vacío si no se lee. "categorias" es opcional; si pones varias, sepáralas con |.

Revisa siempre la lista antes de importar: ChatGPT puede leer mal algún título.
