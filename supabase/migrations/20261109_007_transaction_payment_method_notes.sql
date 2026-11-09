begin;

-- Campos que o formulario avancado de lancamento ja coletava mas nao
-- tinha onde gravar: forma de pagamento e notas livres (a descricao
-- continua na coluna `note`).
alter table public.transactions
  add column if not exists payment_method text,
  add column if not exists notes text;

commit;
