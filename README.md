# bancada.io

O **bancada.io** é um moderno editor 2D voltado para a criação e detalhamento técnico de projetos de bancadas (pedras, mármores, granitos, porcelanatos e superfícies sintéticas). 

Com uma interface visual simples, consistente e profissional, o sistema foi desenvolvido para ser "Uma ferramenta simples e moderna para desenhar uma bancada", sem a complexidade de softwares CAD pesados, focando em usabilidade e produtividade.

## 🚀 Funcionalidades Principais

- **Editor Vetorial (SVG):** Canvas infinito com Pan, Zoom e alinhamento magnético. Totalmente renderizado via SVG para máxima clareza e performance sem bibliotecas pesadas.
- **Geometria Dinâmica:**
  - **Bancadas:** Suporte a bancadas retas e em "L", com redimensionamento inteligente pelas alças.
  - **Áreas Molhadas & Rodabancas:** Instalação hierárquica e cálculo de posicionamento simplificado.
  - **Recortes & Furos:** Adicione cubas, lixeiras, recortes customizados, e torneiras.
  - **Eletrodomésticos:** Insira Cooktops, podendo alternar a visualização entre o tamanho total do cooktop e apenas o nicho/recorte na pedra.
- **Anotações Inteligentes:** Adicione caixas de texto com tamanhos de fonte ajustáveis direto no canvas, com atalhos de clique e edição inline.
- **Cotas Automáticas:** O sistema calcula e exibe automaticamente as dimensões (largura, profundidade, diâmetros) dos elementos selecionados e cotas precisas de bordas, respeitando regras de leitura limpa.
- **Gerenciamento de Estados & Histórico:** Suporte completo a *Desfazer* (Undo) e *Refazer* (Redo), além de copiar, colar, duplicar e excluir itens de maneira hierárquica (duplicar uma bancada duplica também as cubas e furos vinculados a ela).
- **Exportação Profissional:** Exporte rapidamente os projetos e esquemas técnicos finais para arquivos **PDF** de alta resolução e imagens **PNG**.
- **Atalhos Produtivos:** Ferramentas acessíveis via teclado (ex: `T` para texto, espaço + arrastar para navegar, atalhos clássicos `Ctrl+C/V/Z`).

## 🛠 Tecnologias

Este projeto utiliza um ecossistema moderno para a Web:

- **[React 19](https://react.dev/):** Biblioteca principal de renderização.
- **[TypeScript](https://www.typescriptlang.org/):** Tipagem forte e estática.
- **[Vite](https://vitejs.dev/):** Ferramenta de build rápida e HMR instantâneo.
- **[Zustand](https://zustand-demo.pmnd.rs/):** Gerenciamento de estado global leve e otimizado (histórico, clipboard, projeto).
- **[jsPDF](https://github.com/parallax/jsPDF) + [svg2pdf.js](https://github.com/yWorks/svg2pdf.js):** Para a geração de documentos PDF consistentes com fidelidade vetorial.

## 📦 Instalação e Execução

Pré-requisitos: Ter o Node.js e o gerenciador de pacotes `yarn` (ou npm/pnpm) instalados.

1. Clone o repositório.
2. Instale as dependências:
   ```bash
   yarn install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   yarn dev
   ```
4. Acesse a aplicação (normalmente em `http://localhost:5173`).

## 🏗 Estrutura do Projeto

- `/src/editor/` - Lógica principal do aplicativo.
  - `/geometry/` - Funções matemáticas puras, cálculos de colisão (bounds), snap, dimensões e lógica de polígonos.
  - `/rendering/` - Componentes React puramente focados em transformar os dados SVG visuais para cada tipo de elemento (Cooktop, Bancada, Torneira, Texto).
  - `/interactions/` - Handlers de mouse e teclado independentes.
- `/src/store/` - O cérebro da aplicação, definido com Zustand (`editorStore.ts`).
- `/src/components/` - Componentes de interface (botões, painéis, modais de diálogo).
- `/src/models/` - Tipagens TypeScript que formam a estrutura de dados (`types.ts`).

## 🎨 Princípios de Design

1. **Geometria Real, Representação Legível:** O tamanho dos elementos respeita sempre a escala exata (mm). A interface otimiza as áreas de clique e exibe representações que evitam a poluição visual, mesmo em elementos pequenos em escalas grandes.
2. **Sistema Visual Unificado:** Todos os diálogos e menus seguem o mesmo espaçamento, estados e inputs, entregando uma sensação "Premium" para o usuário.
3. **Escala 1:1 Nativa:** O app lida internamente com as medidas reais em milímetros e as traduz em tempo real para SVG de forma que cotas nunca mintam o seu valor base.
