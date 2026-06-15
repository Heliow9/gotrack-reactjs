# Ajustes do checkout — 15/06/2026

- Corrigido erro "Um dos produtos do carrinho não foi encontrado".
- O payload envia somente produtos reais com `produtoId` normalizado.
- Frete segue em `taxaEntrega`; taxa de cartão é validada no backend.
- Feedback mais claro para produto removido, indisponível ou carrinho desatualizado.
- Build de produção validado com Vite.
