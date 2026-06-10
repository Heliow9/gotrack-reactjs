# Ajuste de entrega no checkout da vitrine

Alteração aplicada em `src/pages/Checkout.jsx`.

## O que mudou

- Ao preencher/selecionar endereço, a vitrine valida a área de entrega usando `/api/frete/dados/:restauranteId`.
- Se o endereço não estiver dentro de uma área desenhada ou dentro de uma faixa de raio configurada, o checkout informa:
  - `Não temos entrega disponível para este endereço.`
- Quando a entrega está indisponível:
  - Pix não pode ser gerado.
  - Cartão não pode ser preparado/renderizado.
  - A troca de forma de pagamento fica bloqueada.
- Se o restaurante ainda não tiver área/raio configurado, foi mantida compatibilidade: a vitrine não bloqueia pagamento e considera frete R$ 0,00.
- Build validado com `npm run build`.

## Observação importante

A validação usa as coordenadas retornadas pelo Mapbox e os dados de frete retornados pela API. Para funcionar 100%, o backend precisa retornar `areas`, `faixasRaio` e `localizacaoRestaurante` corretamente.
