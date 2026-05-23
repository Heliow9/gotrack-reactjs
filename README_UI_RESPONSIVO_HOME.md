# Ajuste UI/UX responsivo - Home Garçom

Alterações aplicadas:

- Home agora calcula a largura dos cards com `useWindowDimensions`, evitando quebra errada em Android com DPI/densidade diferente.
- Removido uso de `width: "48.5%"` junto com `gap`, que causava cards em uma coluna em alguns aparelhos.
- Header usa `useSafeAreaInsets`, ficando consistente em iPhone e Android.
- Cards de KPIs e ações rápidas mantêm duas colunas alinhadas em qualquer largura comum de celular.
- Textos importantes usam `numberOfLines` e `adjustsFontSizeToFit` para evitar estouro visual.
- Sombras e espaçamentos refinados para aparência mais premium.

Arquivo principal alterado:

- `src/screens/HomeScreen.js`

Observação:

- O `.env` não foi incluído no pacote para evitar novo bloqueio do GitHub Push Protection.
- Use `.env.example` como modelo e crie seu `.env` localmente.
