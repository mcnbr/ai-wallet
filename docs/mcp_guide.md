# Guia de MCPs para LM Studio

Conforme solicitado, seguem sugestões de MCPs (Model Context Protocol) disponíveis no GitHub que você pode integrar ao seu LM Studio para expandir as capacidades do assistente da Carteira.

## 1. LM Studio MCP Essentials
Ferramentas básicas como calculadora e busca web.
- **Repositório**: [multicody10/lmstudio_mcp_plugin_suite](https://github.com/multicody10/lmstudio_mcp_plugin_suite)
- **O que faz**: Adiciona uma suíte de ferramentas essenciais diretamente ao LM Studio.

## 2. Stock Agent (Inspiracional)
Embora não seja um MCP puro, este projeto utiliza LangChain para pesquisa financeira profunda.
- **Repositório**: [dhirajpatra/stock-agent](https://github.com/dhirajpatra/stock-agent)
- **Destaque**: Implementa ferramentas para `yfinance` que buscam P/E ratio, RSI e tendências de mercado.

## 3. Sandbox-MCP
Para execução segura de código Python pelo assistente.
- **Repositório**: [scooter-lacroix/sandbox-mcp](https://github.com/scooter-lacroix/sandbox-mcp)
- **Uso**: Útil se você quiser que o assistente faça cálculos complexos ou simulações.

## Como instalar um MCP no LM Studio:
1. Localize o arquivo `mcp.json` na pasta de configuração do seu LM Studio.
2. Adicione o snippet de configuração do servidor que você deseja (geralmente encontrado no README do repositório).
3. Reinicie o servidor local do LM Studio.

---
*Nota: Estes MCPs são executados pelo LM Studio e expostos para o nosso backend via API.*
