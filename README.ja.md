# CraftVia Web

CraftViaプロジェクトサイトのソースコードです。Astroで構築し、Cloudflare Workersへデプロイします。

- `/` — 英語版（正本）
- `/ja/` — 日本語版（正式翻訳）

Webサイトはプロジェクトの紹介と、ドキュメント・ハードウェアrepoへの入口を提供します。詳細な技術仕様はこのrepoで重複管理せず、`craftvia-docs`または各ハードウェアrepoで管理します。

## ローカル開発

```sh
npm install
npm run dev
```

開発サーバーは通常 `http://localhost:4321` で起動します。

## コマンド

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバーを起動 |
| `npm run build` | 本番ビルドを作成 |
| `npm run preview` | Cloudflareのローカル環境でビルドを確認 |
| `npm run deploy` | ビルドしてCloudflare Workersへデプロイ |
| `npm run sync-products` | 製品Metadataと代表画像を同期 |
| `npm run generate-types` | Wranglerの環境型を生成 |

## 製品Metadata

ハードウェア概要は、Core-S G031、Station-S、MakerCard-Sの各repoにある`product.json`から生成します。`npm run dev`、`npm run build`、`npm run deploy`では、主処理の開始前に同期を自動実行します。

Local開発では、`craftvia-web`と同じ階層にある各製品repoを優先して参照します。単独の公開Buildなどで製品repoが存在しない場合は、各GitHub repoの正本Metadataと代表WebP画像を取得します。新しいMetadataへ依存するWeb BuildをDeployする前に、対象ハードウェアrepoを先に公開してください。

同期したMetadataと画像は、Build入力として`src/generated/`と`public/generated/`へ配置し、Gitの管理対象から除外します。

## デプロイ

初回のみ `npx wrangler login` でCloudflareへログインし、以後は次を実行します。

```sh
npm run deploy
```

GitHub連携で自動デプロイする場合は、Cloudflare Workers Buildsでこのリポジトリを接続し、ビルドコマンドを `npm run build`、デプロイコマンドを `npx wrangler deploy` に設定します。

## 言語方針

英語版を内容管理上の正本とします。日本語版は正式な翻訳として提供し、可能な限り同じ変更内で追従させます。内容に差異がある場合は英語版を優先します。
