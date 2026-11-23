# Fix: Eventos não aparecem na Vitrine

## Problemas Identificados

### 1. **Colunas faltantes no banco de dados** ❌
O TypeScript espera campos que não existem na tabela `eventos`:
- `artista` (text)
- `whatsapp_reserva` (text) 
- `recorrencia` (jsonb)

### 2. **RLS Policy vs Query Mismatch** ❌
- **RLS Policy** exige: `data_inicio <= now()` 
- **useEventosVigentes** NÃO filtra por `data_inicio <= now()`
- Resultado: Eventos futuros são retornados pelo hook mas **bloqueados pelo RLS** → não aparecem na vitrine

### 3. **Cache Invalidation Bug** ❌
Em `useAtualizarEvento`, variável `updates` não está no escopo do `onSuccess`:
```typescript
// ERRADO - updates não existe aqui
const estabId = (variables as any).estabelecimento_id || (updates as any).estabelecimento_id

// CORRETO - só usar variables
const estabId = (variables as any).estabelecimento_id
```

### 4. **Sem logging para debug** ❌
Impossível saber o que a query retorna sem logs no console.

---

## Arquivos Criados/Modificados

### SQL - Executar no Supabase SQL Editor
| Arquivo | Descrição |
|---------|-----------|
| `scripts/fix-eventos-vitrine.sql` | **PRINCIPAL** - Adiciona colunas, corrige RLS, atualiza enum |

### TypeScript - Modificados
| Arquivo | Mudanças |
|---------|----------|
| `src/hooks/useVitrine.ts` | `useEventosVigentes`: logs detalhados, `staleTime: 30s` |
| `src/pages/vitrine/Vitrine.tsx` | Debug panel com `?debug=true`, logs de eventos recebidos |
| `src/hooks/useAdmin.ts` | `useAtualizarEvento`: fix cache invalidation, logs |
| `src/pages/admin/Eventos.tsx` | `handleSubmit`: logs detalhados do payload enviado |

---

## Como Aplicar

### 1. Execute o SQL no Supabase
```sql
-- No SQL Editor do Supabase Dashboard
-- Cole e execute: scripts/fix-eventos-vitrine.sql
```

**O que o SQL faz:**
- ✅ Adiciona colunas `artista`, `whatsapp_reserva`, `recorrencia` na tabela `eventos`
- ✅ Atualiza enum `tipo_evento` para incluir `'fechado'`, `'reservado'`, `'outro'`
- ✅ **Corrige RLS Policy** - remove filtro `data_inicio <= now()` (permite eventos futuros)
- ✅ Verifica se tudo foi aplicado corretamente

### 2. Deploy da aplicação
As mudanças de TypeScript entram em vigor no próximo build/deploy.

### 3. Testar na Vitrine
Acesse a vitrine com parâmetro de debug:
```
https://seu-dominio.com/capixabas-bar?debug=true
```

Isso mostra um painel amarelo no topo com:
- ID do estabelecimento
- Status de loading/error dos eventos
- Contagem de eventos
- Botão "Forçar Refresh Eventos"
- JSON bruto dos eventos retornados

### 4. Verificar Console do Navegador
Abra DevTools (F12) → Console e procure por:
```
[useEventosVigentes] Query params: {...}
[useEventosVigentes] Eventos retornados: N [...]
[useEventosVigentes] Evento 0: {id, titulo, tipo, ativo, data_inicio, data_fim, isFuture, isPast, ...}
[Vitrine] Eventos recebidos: {estabelecimentoId, loading, error, count, eventos: [...]}
```

No admin, ao salvar:
```
[Eventos] handleSubmit payload: {isEditing, eventoId, payload: {...}}
[useCriarEvento] Event created: {...}
[useAtualizarEvento] Cache invalidation for estabId: ...
```

---

## Checklist de Verificação

Após aplicar as correções, verifique:

- [ ] **SQL executou sem erros** (verifique as queries de verificação no final do script)
- [ ] **Colunas existem**: `SELECT column_name FROM information_schema.columns WHERE table_name = 'eventos'`
- [ ] **RLS policy atualizada**: `SELECT qual FROM pg_policies WHERE tablename = 'eventos' AND policyname = 'Public read active eventos'`
- [ ] **Vitrine com `?debug=true`** mostra painel de debug
- [ ] **Console mostra logs** de `[useEventosVigentes]` e `[Vitrine]`
- [ ] **Criar evento no admin** → aparece na vitrine (mesmo com data futura)
- [ ] **Editar evento no admin** → atualiza na vitrine (cache invalidado)
- [ ] **Evento do tipo 'show'** com `artista` preenchido → aparece em destaque

---

## Explicação Técnica do Fix Principal

### Antes (Problemático)
```sql
-- RLS Policy bloqueava eventos futuros
create policy "Public read active eventos"
  on public.eventos for select
  using (
    ativo = true
    and data_inicio <= now()        -- ❌ BLOQUEIA eventos futuros
    and (data_fim is null or data_fim >= now())
    ...
  );
```

```typescript
// Hook não filtrava data_inicio, mas RLS bloqueava
export function useEventosVigentes(estabelecimentoId: string) {
  const now = new Date().toISOString()
  return useQuery({
    queryFn: async () => {
      const { data } = await supabase
        .from('eventos')
        .select('*')
        .eq('estabelecimento_id', estabelecimentoId)
        .eq('ativo', true)
        .or(`data_fim.is.null,data_fim.gte.${now}`)  // ✅ Só filtra data_fim
        .order('data_inicio')
      // ...
    }
  })
}
```

**Resultado**: Evento com `data_inicio` futura → Hook retorna → RLS bloqueia → **Não aparece na vitrine**

### Depois (Corrigido)
```sql
-- RLS Policy permite eventos futuros (desde que não tenham terminado)
create policy "Public read active eventos"
  on public.eventos for select
  using (
    ativo = true
    -- data_inicio pode ser futura - evento aparece assim que criado
    and (data_fim is null or data_fim >= now())
    and estabelecimento_id in (
      select id from public.estabelecimentos where ativo = true
    )
  );
```

**Resultado**: Evento com `data_inicio` futura → Hook retorna → RLS permite → **Aparece na vitrine** ✅

---

## Próximos Passos (Opcionais)

1. **Reverter `staleTime`** em `useEventosVigentes` para `5 * 60 * 1000` (5 min) após confirmar que funciona
2. **Remover logs verbosos** em produção (manter apenas erros)
3. **Adicionar índice** em `eventos(data_inicio, data_fim)` para performance se tabela crescer
4. **Testar cenários edge**:
   - Evento que já terminou (`data_fim < now`) → não deve aparecer
   - Evento inativo (`ativo = false`) → não deve aparecer
   - Evento de estabelecimento inativo → não deve aparecer
   - Evento recém-criado → deve aparecer imediatamente (cache invalidado)

---

## Arquivos de Referência

- `scripts/fix-eventos-vitrine.sql` - SQL completo para executar no Supabase
- `scripts/setup-eventos-bucket.sql` - Para configurar bucket de storage (se necessário)
- `SOLUTION_SUMMARY.md` - Resumo da correção do upload de banner