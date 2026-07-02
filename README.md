# Meu Sistema — Dashboard de Consumo Global de Álcool

Dashboard privado (protegido por login) que permite subir um arquivo `drinks.csv`,
persistir os dados no **Supabase** e visualizar o consumo global de álcool.

## Fluxo

1. **Página inicial** (`/`): botão **Login** → formulário de usuário e senha.
2. Após autenticar, o usuário é redirecionado ao **Dashboard** (`/dashboard`).
3. No dashboard há um botão para **subir o `drinks.csv`**.
4. Ao subir, os dados são gravados no Supabase e o dashboard exibe a
   **visualização do consumo global de álcool** (cartões de resumo, gráfico de
   barras dos 15 países que mais consomem, distribuição por tipo de bebida e
   tabela detalhada).

Cada upload cria um registro em `uploads` e as linhas correspondentes em `drinks`.

## Stack

- [Next.js 14](https://nextjs.org/) (App Router) + TypeScript
- [Supabase](https://supabase.com/) (Postgres) — persistência
- [Recharts](https://recharts.org/) — gráficos
- [PapaParse](https://www.papaparse.com/) — parsing de CSV
- Autenticação simples via cookie de sessão assinado (HMAC), credenciais em env.

## Modelo de dados (Supabase)

**`uploads`**

| coluna       | tipo        |
| ------------ | ----------- |
| id           | uuid (PK)   |
| filename     | text        |
| row_count    | integer     |
| uploaded_by  | text        |
| created_at   | timestamptz |

**`drinks`**

| coluna                        | tipo         |
| ----------------------------- | ------------ |
| id                            | bigint (PK)  |
| upload_id                     | uuid (FK → uploads.id) |
| country                       | text         |
| beer_servings                 | integer      |
| spirit_servings               | integer      |
| wine_servings                 | integer      |
| total_litres_of_pure_alcohol  | numeric(6,2) |
| created_at                    | timestamptz  |

RLS está **habilitado** em ambas as tabelas sem políticas públicas: apenas o
servidor (usando a `service_role key`) acessa os dados. A chave `anon` não tem acesso.

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

| variável                    | descrição                                        |
| --------------------------- | ------------------------------------------------ |
| `SUPABASE_URL`              | URL do projeto Supabase                          |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (server-side, secreta)          |
| `APP_USER`                  | usuário de login do sistema                      |
| `APP_PASSWORD`              | senha de login do sistema                        |
| `SESSION_SECRET`            | string aleatória longa para assinar a sessão     |

> As variáveis `NEXT_PUBLIC_*` são opcionais e não são usadas no fluxo atual
> (todo acesso ao Supabase é feito no servidor).

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse http://localhost:3000.

## Deploy no Vercel

1. Importe o repositório no Vercel.
2. Em **Settings → Environment Variables**, cadastre as mesmas variáveis do `.env.local`.
3. Deploy. (Framework detectado automaticamente como Next.js.)

## Segurança

- `.env.local` está no `.gitignore` e **não** é versionado.
- Rotacione as chaves do Supabase e a senha caso tenham sido expostas.
