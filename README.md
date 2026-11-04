# Despensa de la semana

App web para:
- **Lista**: agregar lo que hace falta, acomodado por pasillo.
- **En el súper**: poner el precio de cada cosa y ver el total en vivo (con presupuesto).
- **Recetas**: ideas de comida con lo que hay en casa (usa la API de Anthropic).
- **Gym**: rutinas por persona según objetivo, días y nivel, con registro de peso.

Los datos se guardan en el navegador de cada dispositivo (localStorage).

## Publicar en Vercel
1. Importa este repositorio en https://vercel.com/new (Framework: **Other**, sin build command).
2. En **Settings → Environment Variables** agrega `ANTHROPIC_API_KEY` con tu clave de https://console.anthropic.com
3. Vuelve a desplegar (Deployments → Redeploy).

Sin la clave, todo funciona menos las recetas automáticas.
Opcional: `ANTHROPIC_MODEL` para usar otro modelo.

## Probar en tu compu
```
npm i -g vercel
vercel dev
```
