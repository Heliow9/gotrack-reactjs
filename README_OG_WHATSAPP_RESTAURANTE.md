# Prévia WhatsApp dinâmica por restaurante

Foi adicionado um servidor Node para a vitrine (`server.cjs`) que mantém o mesmo link `/p/slug`, mas injeta metatags OpenGraph dinâmicas com nome, descrição e logo do restaurante.

## Produção

```bash
npm install
npm run build
APP_BASE_URL=https://app.movyo.delivery API_BASE_URL=https://SEU_DOMINIO_DA_API npm run start
```

No PM2, use o comando `npm run start` ou `node server.cjs` dentro da pasta da vitrine.

## Importante

Para o WhatsApp mostrar logo/nome do restaurante, o domínio `app.movyo.delivery` precisa apontar para esse servidor Node da vitrine, não apenas para um host estático puro.

A API recebeu a rota leve:

```txt
GET /api/restaurantes/og/:slug
```

Essa rota retorna apenas os dados necessários para a prévia, sem carregar produtos e categorias.
