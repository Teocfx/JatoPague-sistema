🚗 JatoPague - Sistema para Lava-Rápido Autônomo

📖 Sobre o Projeto

Este é um projeto acadêmico desenvolvido para gerenciar um sistema de lava-rápido autônomo (modelo self-service). A aplicação permite que os próprios clientes utilizem os equipamentos de lavagem, contabilizando o tempo exato de uso e calculando o valor final a ser pago de forma automatizada. O objetivo é otimizar o fluxo de clientes e garantir uma cobrança justa e precisa baseada no tempo.

✨ Funcionalidades Principais

Controle de Tempo: Cronômetro integrado para medir o tempo exato de uso das máquinas (água, sabão, aspirador, etc.).

Precificação Dinâmica: Cálculo do valor total a pagar com base na tarifa por minuto/hora configurada no sistema.

Gestão de Sessões: Início, pausa e encerramento das sessões de lavagem.

Histórico de Uso: Registro de todas as lavagens realizadas, incluindo data, duração e valor arrecadado.

Interface Desktop: Interface amigável para operação no local através de um terminal/totem.

🛠️ Tecnologias Utilizadas

Linguagem: JavaScript

Frontend / Aplicação Desktop: Electron

Backend: Node.js (para lógica de negócio e integração)

Banco de Dados: SQL (compatível com SQLite, MySQL ou PostgreSQL)

🚀 Como Rodar o Projeto

Pré-requisitos

Antes de começar, você precisará ter instalado em sua máquina:

Node.js (versão 16 ou superior)

Um servidor de banco de dados SQL (caso utilize SQLite, o banco será gerado localmente em um arquivo).

Passo a passo

Clone o repositório:

git clone https://github.com/seu-usuario/seu-repositorio.git
cd seu-repositorio


Instale as dependências:

npm install


Configuração do Banco de Dados:

Caso não utilize SQLite, crie um banco de dados no seu SGBD preferido.

Copie o arquivo .env.example para .env e preencha as credenciais de acesso ao banco (se necessário).

Execute o script de criação das tabelas (localizado na pasta /sql ou via migrations).

Inicie a aplicação:

npm start


Isso irá inicializar o servidor Node e abrir a janela da aplicação Desktop (Electron).

🎓 Autores
- Felipe maciel
- Maiquel brassiani
- João vitor
- João Pedro Firmo
- Teófilo da costa


Disciplina: Inovação e sustentabilidade

Instituição: Faculdade internacional da paraiba
