# Otimização de imagens no ingest

## Objetivo

Reduzir peso no servidor e garantir compatibilidade com Instagram **sem confiar no cliente**. Toda imagem passa por pipeline no server ao fazer upload — UI e agente podem enviar arquivos grandes; o Iris grava só a versão otimizada.

## Onde roda

```txt
POST /api/posts/:id/assets (multipart)
  → api valida mime/tamanho bruto
  → ImageOptimizer (sharp) — domain rules + adapter
  → MediaStorage grava JPEG otimizado
  → post_assets persiste metadados
```

**Não** otimizar só no agente local — bandwidth pode ser economizada opcionalmente, mas o server é gate obrigatório.

## Pipeline (sharp)

| Passo | Ação |
| ----- | ---- |
| 1 | Rejeitar se raw > `IRIS_UPLOAD_MAX_BYTES` (default 15 MB) — evita DoS |
| 2 | `sharp`: `rotate()` (EXIF orientation) |
| 3 | Resize: maior lado ≤ `IRIS_IMAGE_MAX_LONG_EDGE` (default **1080** — recomendação IG feed) |
| 4 | Sem upscale: `withoutEnlargement: true` |
| 5 | Saída **JPEG** progressive, quality `IRIS_JPEG_QUALITY` (default **85**) |
| 6 | Strip metadata (privacidade + tamanho) |
| 7 | Se ainda > `IRIS_IMAGE_MAX_BYTES` (default **1.5 MB**): reduzir quality em steps (85 → 75 → 65) ou rejeitar com erro claro |
| 8 | Gravar `data/media/{post_id}/{sort_order}.jpg` — **só o otimizado**, original descartado |

PNG com transparência: flatten em fundo branco antes do JPEG (carrossel IG não usa alpha).

WebP de entrada: aceito; sempre normalizado para JPEG na storage v1 (Meta publish aceita JPEG/PNG; JPEG menor).

## Configuração (env)

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `IRIS_UPLOAD_MAX_BYTES` | `15728640` (15 MB) | Limite do upload bruto |
| `IRIS_IMAGE_MAX_LONG_EDGE` | `1080` | Maior lado após resize |
| `IRIS_JPEG_QUALITY` | `85` | Quality inicial |
| `IRIS_IMAGE_MAX_BYTES` | `1572864` (1.5 MB) | Teto após otimização |

Futuro: perfil por `channel` (instagram vs linkedin) em `domain/`.

## Schema (`post_assets`)

Campos adicionais:

| Column | Notes |
| ------ | ----- |
| `width` | px após resize |
| `height` | px após resize |
| `original_size_bytes` | tamanho do upload |
| `optimized_size_bytes` | tamanho em disco |
| `mime` | sempre `image/jpeg` na v1 após pipeline |

## Resposta API

```json
{
  "id": "...",
  "sort_order": 1,
  "original_filename": "hero.png",
  "mime": "image/jpeg",
  "width": 1080,
  "height": 1350,
  "original_size_bytes": 4200000,
  "optimized_size_bytes": 380000,
  "storage_path": "{post_id}/01.jpg"
}
```

Cliente vê economia (`original_size_bytes` vs `optimized_size_bytes`).

## Erros

| Código | Quando |
| ------ | ------ |
| 413 | Raw acima de `IRIS_UPLOAD_MAX_BYTES` |
| 422 | Não é imagem válida / sharp falhou |
| 422 | Não conseguiu ficar abaixo de `IRIS_IMAGE_MAX_BYTES` após quality steps |

## Agente local (opcional)

Skill `push-publication` pode enviar originais — server otimiza. Opcionalmente o agente pode pré-redimensionar para **economizar banda** no upload; não substitui o pipeline do server.

## Dependência

- [`sharp`](https://sharp.pixelplumbing.com/) — única dep nativa de imagem na v1

## Testes

- Fixture PNG 4000×5000 → assert width≤1080, mime jpeg, size < max
- Fixture já pequena → sem upscale, ainda re-encode jpeg
- Oversized raw → 413
