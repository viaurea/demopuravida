# Puesta en marcha — Asaf Transportation

Esta app ya está construida y probada (lee los conductores de un Google Sheet real y los muestra en un panel siempre actualizado). Faltan 3 pasos manuales que solo el dueño de la cuenta puede hacer — no pueden automatizarse desde aquí porque requieren crear credenciales dentro de tu propia cuenta de Google y de Vercel.

El Google Sheet ya existe: **Asaf Transportation - Conductores**
https://docs.google.com/spreadsheets/d/1MXO5zUy2n5L4GAg_PG4Nd2aufiGJkXUnuc9K2ppQEjk/edit

---

## Paso 1 — Crear la cuenta de servicio de Google (~5 min)

Esta es la "llave técnica" que permite a la web leer el Sheet sin usar tu contraseña de Gmail.

1. Entra en [Google Cloud Console](https://console.cloud.google.com/) con la cuenta `info.viaurea@gmail.com`.
2. Crea un proyecto nuevo (o usa uno existente) — el nombre no importa, ej. "Asaf Transportation".
3. Ve a **APIs y servicios → Biblioteca**, busca **Google Sheets API** y pulsa **Habilitar**.
4. Ve a **APIs y servicios → Credenciales → Crear credenciales → Cuenta de servicio**.
   - Nombre: `asaf-transportation-app`
   - No hace falta darle ningún rol de proyecto — pulsa **Listo**.
5. Abre la cuenta de servicio recién creada → pestaña **Claves** → **Agregar clave → Crear clave nueva → JSON**. Se descarga un archivo `.json`.
6. Abre ese archivo. Necesitas dos valores:
   - `client_email` → esto es `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → esto es `GOOGLE_PRIVATE_KEY` (cópialo tal cual, con los `\n` incluidos)
7. **Comparte el Google Sheet** con ese `client_email` (el que termina en `...iam.gserviceaccount.com`), dándole permiso de **Lector** — es como compartirlo con un compañero, botón "Compartir" arriba a la derecha del Sheet.

## Paso 2 — Desplegar en Vercel (~5 min)

1. Entra en [vercel.com](https://vercel.com) e inicia sesión con GitHub (crea una cuenta gratis si no tienes).
2. **Add New → Project** → importa el repositorio `viaurea/demopuravida`.
3. En **Root Directory**, selecciona la carpeta `asaf-app` (importante — si no, Vercel intentará desplegar todo el repo).
4. En **Environment Variables**, añade:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` → el valor del paso 1
   - `GOOGLE_PRIVATE_KEY` → el valor del paso 1 (pégalo completo, entre comillas si el campo lo requiere)
   - `GOOGLE_SHEET_ID` → `1MXO5zUy2n5L4GAg_PG4Nd2aufiGJkXUnuc9K2ppQEjk`
5. Pulsa **Deploy**. En 1-2 minutos tendrás una URL fija tipo `asaf-app.vercel.app` — esa es la que abres siempre desde el navegador, sin contraseña.

## Paso 3 — Alertas automáticas por email (opcional, ~3 min)

Si quieres el correo diario avisando de documentos que vencen en 7 días o menos:

1. Crea una cuenta gratis en [resend.com](https://resend.com).
2. Genera una **API Key**.
3. En Vercel, añade las variables de entorno:
   - `RESEND_API_KEY` → la clave de Resend
   - `ALERT_EMAIL_TO` → `info.viaurea@gmail.com` (o el correo que prefieras recibir las alertas)
4. Vuelve a desplegar (Vercel → Deployments → Redeploy). El cron ya está configurado en `vercel.json` para correr todos los días a las 8am hora de Texas (13:00 UTC).

Sin este paso, la app funciona igual — simplemente no manda el email diario; los vencimientos se siguen viendo en el panel (amarillo/rojo).

---

## Qué falta después de esto

- **Cargar los conductores reales**: edita directamente el Google Sheet, borra las filas de ejemplo y mete los datos reales. El panel se actualiza al pulsar "Actualizar" en la web.
- **Registro automático de correos** (fase 2, no incluida todavía): conectar el Gmail de la empresa para guardar automáticamente los correos relevantes junto a cada conductor.

## Desarrollo local

```bash
cd asaf-app
npm install
cp .env.example .env.local   # rellena los valores del paso 1
npm run dev
```
