<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# FrotaControl — Torre de Controle

**Sistema de Gestão de Frota e Logística do Grupo CCA**

[![Deploy](https://github.com/Averaldo1979/Torre-de-Controle/actions/workflows/deploy.yml/badge.svg)](https://github.com/Averaldo1979/Torre-de-Controle/actions/workflows/deploy.yml)

</div>

---

## Visão Geral

Sistema completo de gestão de frota, manutenção, colaboradores, pneus, EPIs, combustível e cargas.
Frontend React + Vite, backend Node.js + Express + PostgreSQL.

**Acesso:** `http://192.168.0.108:8080` (rede local) · `http://100.105.43.53:8080` (Tailscale)

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│  Navegador (React SPA)                                  │
│  http://192.168.0.108:8080                              │
└──────────────┬──────────────────────────────────────────┘
               │
       ┌───────▼───────┐
       │    Nginx       │  porta 8080
       │  /api/  → 5000 │  proxy reverso
       │  /rest/ → 3002 │
       │  /*    → SPA   │
       └───┬───────┬────┘
           │       │
    ┌──────▼──┐ ┌──▼──────────┐
    │ server  │ │  frota-api  │
    │  .cjs   │ │  server.js  │
    │ :5000   │ │   :3002     │
    └────┬────┘ └──────┬──────┘
         │             │
    ┌────▼─────────────▼────┐
    │   PostgreSQL :5432    │
    │   DB: averaldo_teste  │
    │   27 tabelas          │
    └───────────────────────┘
```

### Componentes

| Componente | Porta | Descrição |
|-----------|-------|-----------|
| **Nginx** | 8080 | Serve SPA + proxy reverso |
| **server.cjs** | 5000 | API Express (`/api/:table`) — CRUD genérico |
| **frota-api** | 3002 | API PostgREST-compatible (`/rest/v1/:table`) |
| **PostgreSQL** | 5432 | Banco `averaldo_teste` |

---

## Deploy Automático (CI/CD)

### Como funciona

```
Push no main → GitHub Actions → Tailscale VPN → SSH na VM 108 → build + deploy
```

1. Você faz `git push` na branch `main`
2. GitHub Actions dispara automaticamente
3. Runner conecta na rede Tailscale
4. Via SSH, executa na VM:
   - `git pull`
   - `npm install` (se `package.json` mudou)
   - `npm run build`
   - Copia `dist/` para Nginx
   - Reinicia `torre-api` via PM2 (se `server.cjs` mudou)
   - Reload Nginx

### Secrets necessários (já configurados)

| Secret | Descrição |
|--------|-----------|
| `TAILSCALE_AUTHKEY` | Auth key do Tailscale (reusable + ephemeral) |
| `VM_SSH_KEY` | Chave SSH privada (ed25519) para acessar VM como root |

### Disparar deploy manual

O workflow também aceita `workflow_dispatch` — vá em **Actions → Deploy Torre de Controle → Run workflow**.

---

## Desenvolvimento Local

### Pré-requisitos

- **Node.js** 18+ (recomendado 22)
- **PostgreSQL** 14+ com banco `averaldo_teste`
- **npm** (vem com Node.js)

### Setup

```bash
# 1. Clonar
git clone https://github.com/Averaldo1979/Torre-de-Controle.git
cd Torre-de-Controle

# 2. Instalar dependências
npm install

# 3. Configurar banco (opcional - cria .env)
cat > .env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=averaldo_teste
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui
EOF

# 4. Subir backend
node server.cjs
# → API rodando em http://localhost:5000

# 5. Subir frontend (outra aba)
npm run dev
# → App rodando em http://localhost:5173
```

### Se não tem o banco local

Opção A — Túnel SSH para a VM:
```bash
ssh -L 5432:localhost:5432 root@192.168.0.108
# Depois rode normalmente: node server.cjs
```

Opção B — Setup do banco do zero:
```bash
node run_setup.cjs
# Cria o banco e as tabelas automaticamente
```

---

## Banco de Dados

**Banco:** `averaldo_teste` (PostgreSQL)

> ⚠️ **IMPORTANTE:** O banco correto é `averaldo_teste`, NÃO `cca_diarias`.
> O `cca_diarias` é do app de diárias (outro projeto).

### Tabelas principais

| Tabela | Registros | Descrição |
|--------|-----------|-----------|
| drivers | 528 | Motoristas/colaboradores |
| maintenance_logs | 224 | Registros de manutenção |
| ppe_movements | 368 | Movimentações de EPIs |
| vehicles | 44 | Veículos da frota |
| teams | 41 | Equipes |
| cargas | 37 | Registros de cargas |
| app_users | 9 | Usuários do sistema |
| units | 8 | Unidades operacionais |

### Todas as tabelas

```
app_users, attendance, cargas, checklists, drivers,
equipment_maintenance_logs, equipments, fuel_logs, fuel_types,
history_logs, hr_events, maintenance_logs, odometer_logs,
ppe_items, ppe_movements, suppliers, team_role_values, teams,
tyre_audits, tyre_brands, tyre_models, tyre_movements,
tyre_repairs, tyres, units, vehicles, washing_logs
```

---

## Servidor de Produção (VM 108)

### Informações

| Item | Valor |
|------|-------|
| **IP Local** | 192.168.0.108 |
| **IP Tailscale** | 100.105.43.53 |
| **Hostname** | cca-dev |
| **OS** | Ubuntu 22.04 |
| **Node** | v22.21.0 |
| **PostgreSQL** | 16 |

### Caminhos importantes

```
/opt/torre-de-controle/         → Código fonte (git repo)
/var/www/cca/torre-controle/    → Build do frontend (servido pelo Nginx)
/etc/nginx/sites-available/torre-controle → Config Nginx
```

### Comandos úteis na VM

```bash
# Status dos serviços
pm2 status                       # Ver processos Node.js
systemctl status nginx           # Ver Nginx

# Logs
pm2 logs torre-api               # Logs da API
tail -f /var/log/nginx/access.log # Logs Nginx

# Restart manual
pm2 restart torre-api            # Reiniciar API
systemctl reload nginx           # Reload Nginx

# Deploy manual (se CI/CD falhar)
cd /opt/torre-de-controle
git pull origin main
npm run build
cp -r dist/* /var/www/cca/torre-controle/
pm2 restart torre-api
systemctl reload nginx
```

---

## Módulos do Sistema

| Módulo | Componente | Descrição |
|--------|-----------|-----------|
| Painel Estratégico | `Dashboard.tsx` | KPIs, gráficos, resumo geral |
| Gestão de Ativos | `FleetManagement.tsx` | Cadastro de veículos |
| Portaria & KM | `OdometerManagement.tsx` | Controle de odômetro |
| Combustível | `FuelManagement.tsx` | Abastecimentos |
| Manutenção | `MaintenanceManagement.tsx` | Ordens de serviço |
| Ativos Industriais | `EquipmentMaintenance.tsx` | Equipamentos |
| Estética & Lavagem | `WashingManagement.tsx` | Lavagens |
| Gestão de Pneus | `TyreManagement.tsx` | Pneus e auditorias |
| Hub de Parceiros | `SupplierManagement.tsx` | Fornecedores |
| Unidades | `UnitManagement.tsx` | Unidades operacionais |
| Equipes | `TeamManagement.tsx` | Times |
| Cadastro Valores | `TeamValueRegistry.tsx` | Valores por função |
| Registro de Cargas | `CargaRegistry.tsx` | Cargas transportadas |
| Colaboradores | `DriverManagement.tsx` | Motoristas |
| Config. Acessos | `UserManagement.tsx` | Usuários e permissões |
| Recursos Humanos | `HRManagement.tsx` | Eventos de RH |
| Checklist | `Checklist.tsx` | Checklists de veículos |
| Telemetria | `TelemetryMonitor.tsx` | Monitoramento de frota |
| Relatório IA | `AIManagementReport.tsx` | Relatório gerado por IA |

---

## IA (Gemini)

O sistema usa a **API do Google Gemini** para gerar relatórios gerenciais automáticos.

### Configuração

O serviço está em `services/geminiService.ts`. Para funcionar:

1. Obtenha uma API key em https://ai.google.dev/
2. Crie `.env.local` na raiz:
   ```
   VITE_GEMINI_API_KEY=sua_chave_aqui
   ```
3. O relatório IA fica disponível no menu **"Relatório IA"**

### Como funciona

- O componente `AIManagementReport.tsx` coleta dados de todos os módulos
- Envia para a API Gemini com um prompt estruturado
- Gemini retorna análise gerencial com insights e recomendações
- O relatório pode ser exportado/impresso

> **Nota:** Sem a API key, o módulo de IA simplesmente não aparece ou mostra erro.
> Isso NÃO afeta o resto do sistema.

---

## Fluxo de Trabalho Recomendado

### Para desenvolvedores

```
1. git pull origin main           ← Atualizar
2. npm install                    ← Se package.json mudou
3. npm run dev                    ← Subir frontend local
4. node server.cjs                ← Subir backend local (outra aba)
5. Fazer suas alterações
6. Testar localmente
7. git add . && git commit -m "feat: descrição"
8. git push origin main           ← Deploy automático!
```

### Convenção de commits

```
feat: nova funcionalidade
fix: correção de bug
style: mudança visual (CSS, layout)
docs: documentação
refactor: refatoração sem mudar comportamento
chore: tarefas de manutenção
```

### O que NÃO fazer

- **NÃO** alterar o nome do banco para `cca_diarias` (banco errado!)
- **NÃO** subir credenciais em `.env` ou `.env.local` para o repositório
- **NÃO** fazer push direto se não testou localmente
- **NÃO** mexer no workflow `.github/workflows/deploy.yml` sem avisar

---

## Troubleshooting

### Dashboard mostra tudo zerado
- Verificar se `server.cjs` está rodando: `pm2 status`
- Verificar se o banco é `averaldo_teste`: `grep database server.cjs`
- Verificar proxy Nginx: `curl http://localhost:8080/api/vehicles`

### Deploy falhou no GitHub Actions
- Verificar se o Tailscale auth key não expirou
- Verificar SSH: `ssh root@100.105.43.53` (via Tailscale)
- Rodar deploy manual na VM (comandos acima)

### API retorna erro 500
- Verificar logs: `pm2 logs torre-api`
- Verificar se PostgreSQL está rodando: `systemctl status postgresql`
- Testar conexão: `psql -U postgres -h localhost -d averaldo_teste`

---

## Contato

**Grupo CCA Carregamentos** — TI
Lucas (Desenvolvimento) · Averaldo (Gestão de Frota)
