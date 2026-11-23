# Solução para o Problema de Upload de Banner de Eventos

## Problema Original
- POST para o bucket "eventos" retornava 400 (Bad Request) com "new row violates row-level security policy"
- Caía em fallback base64, fazendo o evento não salvar corretamente
- Payloads gigantes de base64 causavam timeouts e falhas

## Arquivos Modificados

### 1. SQL - Configuração Completa do Bucket "eventos"
**Arquivo:** `scripts/setup-eventos-bucket.sql`

Execute este script no **SQL Editor do Supabase** para:
- Criar/atualizar o bucket "eventos" com configurações corretas (10MB, tipos de imagem permitidos, público)
- Remover políticas antigas conflitantes
- Criar políticas RLS corretas para o bucket "eventos"
- Verificar se tudo foi criado corretamente

### 2. Código TypeScript - Remoção do Fallback Base64

#### `src/lib/supabase.ts`
**Mudanças principais:**
- **`uploadImage`**: Removido fallback base64. Agora lança erro claro e acionável com instruções específicas:
  - Erro RLS → "Configure as políticas do bucket..."
  - Erro tamanho → "Arquivo excede o limite..."
  - Erro MIME → "Tipo de arquivo não permitido..."
  - Erro 400/404 → "Bucket não encontrado / verifique configuração"
- **`uploadGalleryImage`**: Reutiliza `uploadImage` para consistência
- **`deleteImage`**: Removido tratamento silencioso de base64, agora lança erro real
- Removida função `fileToDataURL` (não utilizada)

#### `src/pages/admin/Estabelecimento.tsx`
**Mudanças:**
- `handleLogoUpload`: Removido detecção base64, mensagem simplificada
- `handleCapaUpload`: Removido detecção base64, mensagem simplificada
- `handleGalleryUpload`: Removido detecção base64, mensagem simplificada

#### `src/hooks/useAdmin.ts`
**Mudanças:**
- `useAtualizarEstabelecimento`: Removido warning de base64 no payload (não acontece mais)

## Como Aplicar

### 1. Execute o SQL no Supabase
```bash
# No SQL Editor do Supabase Dashboard
# Cole e execute o conteúdo de scripts/setup-eventos-bucket.sql
```

### 2. Verifique se o bucket foi criado
```sql
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'eventos';
```

### 3. Verifique as políticas
```sql
select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
and policyname like '%eventos%';
```

### 4. Deploy da aplicação
As mudanças no código TypeScript entram em vigor no próximo build/deploy.

## Estrutura de Path Obrigatória
Para o RLS funcionar, o path do upload **DEVE** começar com o `estabelecimento_id`:

```typescript
// CORRETO (já implementado em useUploadEventoBanner)
const path = `${estabelecimentoId}/eventos/${eventoId}/${Date.now()}.${ext}`
// Exemplo: "abc-123/eventos/evt-456/1700000000.jpg"

// INCORRETO (falha no RLS)
const path = `eventos/${eventoId}/${Date.now()}.${ext}`
```

## Pré-requisitos para Funcionar
1. ✅ Bucket "eventos" existe e é público
2. ✅ Políticas RLS criadas corretamente
3. ✅ Usuário autenticado (`auth.uid() not null`)
4. ✅ Usuário tem perfil na tabela `perfis` com `estabelecimento_id` preenchido
5. ✅ Função `current_estabelecimento_id()` existe e funciona

## Benefícios da Solução
- ✅ **Sem mais base64**: Payloads pequenos, sem timeout
- ✅ **Erros claros**: Mensagens acionáveis para o usuário final
- ✅ **Logging detalhado**: Console mostra exatamente o que falhou
- ✅ **Consistência**: Mesmo tratamento de erro para todos os buckets
- ✅ **Performance**: Upload direto para CDN do Supabase Storage