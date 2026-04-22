# Pasta shared/

Este diretório é destinado a código compartilhado entre o app web (Next.js) e o app mobile (Expo).

## Exemplos de uso
- Funções utilitárias (ex: validação de dados, helpers de formatação)
- Modelos de dados (tipos, interfaces)
- Constantes globais

## Como importar
- No web: `import { algo } from '../../shared/...'`
- No mobile: `import { algo } from '../shared/...'`

> Mantenha o código nesta pasta livre de dependências específicas de plataforma (React DOM, React Native, etc).