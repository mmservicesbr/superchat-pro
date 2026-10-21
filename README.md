# 🚀 SingleChat Pro - Plataforma Multiatendente & WhatsApp (SaaS White-Label)

Plataforma independente de atendimento multicanal, live chat multiatendente, gestão visual de vendas via Kanban CRM e automação de WhatsApp.

Desenvolvida com arquitetura de alta performance, moderna e sem restrições de licença: **você é o proprietário e administrador total do código**, podendo utilizar em sua própria operação ou comercializar planos mensais (modelo SaaS White-Label).

---

## 🌟 Funcionalidades e Módulos Inclusos

1. **Atendimento ao Vivo (Live Chat Multiatendente)**:
   - Divisão de conversas em abas operacionais: *Aguardando na Fila*, *Em Atendimento* e *Resolvidos*.
   - Mensageria instantânea com **WebSockets (Socket.io)**.
   - Simulador de mensagens de áudio gravadas (estilo PTT WhatsApp).
   - Notas internas privativas (visíveis apenas para os atendentes com ícone de cadeado).
   - Respostas rápidas instantâneas digitando `/` no campo de texto (ex: `/ola`, `/pix`, `/horario`).
   - Botão para simular respostas reais de clientes e testar o tempo de resposta em tempo real.
   - Atribuição, transferência entre departamentos e finalização com avaliação de satisfação (CSAT).

2. **Kanban CRM Visual**:
   - Gestão das conversas em colunas: *Novos Leads*, *Em Triagem*, *Negociação / Proposta*, *Aguardando Cliente* e *Fechado / Ganho*.
   - Transição ágil entre etapas com animação de confetes ao fechar negócios.

3. **Conexões WhatsApp**:
   - Painel para conectar múltiplas linhas simultâneas.
   - Gerador de QR Code com temporizador de expiração e simulação de leitura.
   - Arquitetura compatível com Baileys, Evolution API e WhatsApp Cloud API oficial.

4. **Filas & Chatbot URA**:
   - Criação e personalização de departamentos (Comercial, Suporte, Financeiro, etc.) com cores e mensagens automáticas de triagem.

5. **Equipe & Usuários**:
   - Níveis de permissão: `superadmin` (dono da plataforma), `admin` (gestor da empresa), `supervisor` e `agent` (atendente).
   - Status dos operadores em tempo real (Online, Ocupado, Offline).

6. **Métricas & Dashboard (BI)**:
   - Volume total de chamados, atendimentos em aberto e fila de espera.
   - Tempo Médio de Espera (TME) e Tempo Médio de Atendimento (TMA).
   - Gráfico de distribuição de carga por departamento e ranking de produtividade da equipe.

7. **Painel Super Administrador (Revenda SaaS)**:
   - Cadastro de empresas contratantes, definição de planos (*Básico, Profissional, Enterprise*) e limites de atendentes e WhatsApps.
   - Bloqueio/reativação instantânea de clientes.

---

## 🔑 Credenciais Padrão de Acesso (Demonstração)

| Perfil | E-mail | Senha | Descrição |
| :--- | :--- | :--- | :--- |
| **Super Administrador** | `admin@singlechat.com` | `123456` | Acesso total à plataforma, empresas SaaS e configurações |
| **Atendente Comercial** | `ana@singlechat.com` | `123456` | Focado em vendas e atendimento da fila comercial |
| **Atendente Suporte** | `carlos@singlechat.com` | `123456` | Focado em suporte técnico e resolução de chamados |

*(Na tela de login, há botões de 1 clique para preenchimento rápido dessas credenciais)*.

---

## 💻 Como Rodar Localmente no seu Computador

### 1. Iniciar o Backend (Porta 3001)
Abra um terminal na pasta do projeto e execute:
```bash
npm run dev:backend
```
O servidor inicializará o banco de dados SQLite persistente em `./backend/data/singlechat.sqlite` e os WebSockets.

### 2. Iniciar o Frontend (Porta 5173)
Abra outro terminal na pasta do projeto e execute:
```bash
npm run dev:frontend
```
Acesse no seu navegador: **`http://localhost:5173`**

---

## ☁️ Como Hospedar na sua VPS com Coolify

Sua VPS com **Coolify** é o ambiente perfeito para hospedar esta plataforma.

### Passo a Passo no Coolify:

1. **Suba este projeto para um repositório no seu GitHub/GitLab** (ou crie um repositório Git local na VPS):
   ```bash
   git init
   git add .
   git commit -m "feat: singlechat pro plataforma multiatendente"
   ```
2. **No painel do Coolify**:
   - Clique em **+ New Resource** > **Docker Compose**.
   - Conecte o seu repositório Git ou cole diretamente o conteúdo do arquivo `docker-compose.yml`.
3. **Configuração de Domínio**:
   - Defina o domínio que deseja apontar no Coolify (exemplo: `app.seudominio.com.br`).
   - O Coolify gerenciará automaticamente o certificado SSL gratuito (HTTPS e WebSockets WSS) via Let's Encrypt.
4. **Deploy com 1 Clique**:
   - Clique em **Deploy**. O Coolify compilará o frontend, iniciará o backend em contêineres Docker isolados com reinício automático (`restart: unless-stopped`) e persistência no volume de dados.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Vite, Lucide Icons, Canvas Confetti.
- **Estilização**: Vanilla CSS com Design System moderno, Dark Mode e Glassmorphism.
- **Backend**: Node.js v24+, Express, TypeScript (tsx), JSON Web Tokens (JWT), Bcrypt.
- **Tempo Real**: WebSockets nativos com Socket.io.
- **Banco de Dados**: SQLite persistente com zero dependências externas (pronto também para PostgreSQL).
- **Deploy & Infraestrutura**: Docker, Docker Compose, Nginx Reverse Proxy e compatibilidade total com Coolify.
