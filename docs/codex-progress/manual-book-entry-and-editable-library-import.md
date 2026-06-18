status
completed

o que foi concluido
- unifiquei os fluxos de entrada manual, Google Books e ISBN fallback em um mesmo draft editavel antes da persistencia
- adicionei a tela `app/library/manual.tsx` e converti `/library/google-books/[volumeId]` para o mesmo formulario editavel
- habilitei edicao de metadados antes de importar, incluindo titulo, subtitulo, autores, editora, data, paginas, idioma, descricao e ISBNs
- implementei selecao, substituicao e remocao de capa com persistencia local segura em `documentDirectory/book-covers/`
- evitei persistir URIs temporarias do picker e limpei arquivos locais temporarios de drafts descartados
- adicionei validacao normalizada para titulo, autores, datas civis, numeros de pagina e ISBN-10/ISBN-13
- adicionei deteccao de duplicatas por ISBN, ids externos, edicao existente e sugestao de obra local por titulo/autores
- mantive a gravacao manual com `metadataSource='manual'`, `externalMetadataId=null` e `googleBooksId=null`
- atualizei backup/restore para serializar capas locais como `coverAssets` e restaurar os arquivos no dispositivo
- ampliei traducoes `en` e `pt-BR` para o novo fluxo de draft editavel

migracoes e modelo
- nova migration incremental: `src/database/migrations/0002_solid_butterfly.sql`
- `editions.external_metadata_id` agora aceita `null`
- `editions` passou a armazenar `cover_source`, `cover_mime_type` e `cover_file_name`
- `model.dbdiagram` foi alinhado com o schema atualizado

api publica adicionada
- `api.library.createManualBookDraft`
- `api.library.createDraftFromMetadata`
- `api.library.validateBookDraft`
- `api.library.findPotentialBookDuplicates`
- `api.library.addEditableBookDraftToLibrary`
- `api.library.selectLocalBookCover`
- `api.library.removeBookCover`
- `api.library.discardDraftLocalBookCover`

arquivos principais
- `src/application/use-cases/library/editable-book-drafts.ts`
- `src/infrastructure/library/book-cover-storage.ts`
- `src/presentation/library/add/editable-book-screen.tsx`
- `src/database/schema/editions.ts`
- `src/database/transactions/save-book-to-library.ts`
- `src/infrastructure/backup/database-backup-reader.ts`
- `src/infrastructure/backup/database-backup-restorer.ts`
- `src/localization/locales/en.ts`
- `src/localization/locales/pt-BR.ts`

comandos e resultados
- `npx tsc --noEmit --pretty false`: passed
- `npm run lint`: passed
- `npm test`: passed

limitacoes conscientes
- a selecao de capa local usa `expo-document-picker`, que ja existia no projeto, em vez de abrir a galeria via `expo-image-picker`
- o fluxo ainda nao oferece recorte/edicao visual da imagem de capa
- nao foi criado teste de renderizacao React Native para a tela completa porque o projeto ainda nao possui essa infraestrutura

proximo ponto natural
- integrar camera/scan de ISBN e opcionalmente uma experiencia de escolha de imagem mais rica, reaproveitando o mesmo draft editavel
