# JatoPague

Painel de operação para lava-rápido self-service. A interface React acompanha os equipamentos, cronometra cada uso e calcula o valor da sessão conforme a tarifa configurada.

## Funcionalidades

- Iniciar, pausar, retomar e encerrar sessões de lavagem.
- Atender clientes pelo totem: selecionar equipamento e serviço, acompanhar a lavagem e conferir o resumo final.
- Simular pagamento após a lavagem por Pix demonstrativo ou cartão de crédito/débito.
- Acompanhar o tempo e o valor parcial de cada equipamento em tempo real.
- Configurar tarifas por serviço; a tarifa fica fixa durante cada sessão iniciada.
- Consultar o histórico de sessões, duração e valor arrecadado.
- Manter sessões ativas, tarifas e histórico após recarregar a página.
- Usar o painel em telas grandes ou em dispositivos móveis.

## Tecnologias

JavaScript, React, Vite e Lucide. Os dados são salvos no armazenamento local do navegador (`localStorage`).

## Executar localmente

Requer Node.js 18 ou superior.

```bash
npm install
npm run dev
```

Para gerar a versão de produção:

```bash
npm run build
npm run preview
```

O painel atual é uma aplicação web local. A etapa de pagamento é fictícia: o QR do Pix não é pagável e o cartão apenas simula uma confirmação, sem cobrar ou solicitar dados financeiros. O sistema também não integra equipamentos físicos nem um banco de dados remoto; os dados ficam no navegador em que é operado.

## Autores

- Felipe Maciel
- Maiquel Brassiani
- João Vitor
- João Pedro Firmo
- Teófilo da Costa

Disciplina: Inovação e Sustentabilidade

Instituição: Faculdade Internacional da Paraíba
