# Ajuste de rotas da vitrine Movyo

Alterações aplicadas:

- Removida a rota web `/login`.
- Removidos os arquivos web relacionados ao login:
  - `src/pages/Login.jsx`
  - `src/MainRouter.jsx`
- A rota raiz `/` agora redireciona automaticamente para:
  - `/p/{slug}` quando existir slug salvo em `localStorage.restauranteSelecionado`;
  - `/p` quando não existir slug salvo.
- Logout e redirecionamentos internos que apontavam para `/login` ou `/` foram ajustados para a vitrine pública.
- O painel protegido foi movido de `/` para `/admin`, deixando a raiz exclusiva para a vitrine.
- Build de produção executado com sucesso em `dist/`.

Comportamento esperado:

- `https://app.movyo.delivery/` abre a última vitrine acessada, caso exista slug salvo no navegador.
- Sem slug salvo, `https://app.movyo.delivery/` abre `https://app.movyo.delivery/p`.
- Links de restaurante continuam em `https://app.movyo.delivery/p/restaurante-slug`.
