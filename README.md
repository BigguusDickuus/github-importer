# Oráculo IA - Tarot, Lenormand e Cartomancia Online

Aplicação web de consultas de tarot, lenormand e cartomancia com inteligência artificial.

## 🔮 Sobre o Projeto

O Oráculo IA é uma plataforma online que oferece consultas personalizadas através de diferentes métodos de leitura: Tarot, Lenormand e Cartomancia Clássica. Utilizando inteligência artificial, a plataforma oferece interpretações precisas e insights valiosos.

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── ui/             # Componentes UI reutilizáveis (shadcn/ui)
│   ├── icons/          # Ícones customizados
│   ├── Landing.tsx     # Página inicial (deslogado)
│   ├── HomeLogada.tsx  # Página inicial (logado)
│   ├── Dashboard.tsx   # Dashboard principal
│   ├── Header.tsx      # Cabeçalho da aplicação
│   ├── Login.tsx       # Página de login
│   ├── History.tsx     # Histórico de leituras
│   ├── Credits.tsx     # Compra de créditos
│   ├── Profile.tsx     # Perfil do usuário
│   ├── Admin.tsx       # Área administrativa
│   └── ...            # Outros componentes
├── pages/              # Páginas da aplicação
├── index.css           # Estilos globais e Tailwind
└── App.tsx            # Configuração de rotas
```

## 🛣️ Rotas Disponíveis

- `/` - Landing page (usuários deslogados)
- `/dashboard` - Dashboard principal (usuários logados)
- `/login` - Página de login
- `/historico` - Histórico de leituras
- `/transacoes` - Histórico de transações
- `/creditos` - Compra de créditos
- `/perfil` - Perfil do usuário
- `/admin` - Área administrativa

## 🚀 Tecnologias

- **React 18** - Biblioteca JavaScript para interfaces
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS utility-first
- **Radix UI** - Componentes acessíveis
- **React Router** - Roteamento
- **Framer Motion** - Animações
- **Shadcn/ui** - Componentes UI

## 💻 Executando o Projeto

```bash
# Instalar dependências
npm install

# Executar em modo de desenvolvimento
npm run dev

# Build para produção
npm run build
```

O projeto estará disponível em `http://localhost:8080`

## 🎨 Design System

A aplicação utiliza um design system baseado em temas escuros com cores místicas:

- **night-sky**: Fundo principal (#0a0e27)
- **midnight-surface**: Superfícies (#141b3d)
- **mystic-indigo**: Cor primária (#6366f1)
- **oracle-ember**: Cor de destaque (#f59e0b)
- **starlight-text**: Texto principal (#f8fafc)
- **moonlight-text**: Texto secundário (#cbd5e1)

## 📦 Deploy

Acesse [Lovable](https://lovable.dev/projects/1cb79e60-2c2f-48d4-8a0f-0f3229062b3d) e clique em Share → Publish.
