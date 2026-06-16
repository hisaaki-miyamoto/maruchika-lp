# GA4 アクセス計測・レポート 手順書（maruchika-lp）

各LP（現在は `koura/` ＝ 甲羅盛り）のアクセス数（セッション・ユーザー・ページビュー）を確認するための仕組みです。

---

## まず：アクセス数を見るだけなら GA4 の画面でOK

GA4 を入れておけば、**管理画面だけでアクセス数が見られます**（スクリプト不要）。
- リアルタイム：GA4 →「レポート」→「リアルタイム」
- 期間のアクセス：GA4 →「レポート」→「エンゲージメント」→「ページとスクリーン」で `/koura/` を確認

このスクリプトは、**それを自動で日本語レポート化／定期取得したいとき**に使います。

---

## STEP 1：LPに測定IDを入れる（5分）

1. GA4管理画面 →「データストリーム」→ **測定ID（`G-` から始まる）** をコピー
2. `koura/js/analytics.js` 先頭の `GA4_MEASUREMENT_ID = "G-XXXXXXXXXX"` を、その測定IDに書き換え
3. `git add -A && git commit -m "Set GA4 ID" && git push` で反映
   - ※IDを入れるまでは計測オフ（アクセス数は貯まりません）

---

## STEP 2：データ取得用の「鍵」を作る（初回のみ・15分ほど）

1. **Google Cloud Console** でプロジェクトを用意 →「Google Analytics Data API」を有効化
2. 「サービスアカウント」を作成 →「鍵」→ JSON をダウンロード
3. その JSON を `tools/secrets/ga4-sa.json` に置く（`.gitignore` 済み＝GitHubには上がりません）
4. **GA4管理** →「プロパティのアクセス管理」→ そのサービスアカウントのメールを **「閲覧者」** で追加
5. **GA4プロパティID（数値）** を控える（測定ID `G-...` とは別物）

---

## STEP 3：レポートを動かす

```powershell
pip install google-analytics-data   # 初回のみ

$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\Users\maruc\Claude\lp\tools\secrets\ga4-sa.json"
$env:GA4_PROPERTY_ID = "123456789"  # ←あなたのGA4プロパティID

python tools/ga4_access_report.py        # 直近14日
python tools/ga4_access_report.py 28     # 直近28日
```

結果は画面に表示され、`reports/ga4-access-YYYY-MM-DD.md` にも保存されます。
内容：セッション・ユーザー・PV・平均滞在時間・購入ボタンのクリック数＋日別推移。

> 別のLPを見たいとき（今後 `osechi/` 等を追加した場合）：
> `$env:GA4_PAGE_PATH = "/osechi/"` を指定してから実行。

---

## 定期実行（任意・毎朝など）

Windowsタスクスケジューラ例（毎朝9時）：

```powershell
$action  = New-ScheduledTaskAction -Execute "python" -Argument "tools\ga4_access_report.py" -WorkingDirectory "C:\Users\maruc\Claude\lp"
$trigger = New-ScheduledTaskTrigger -Daily -At 9:00am
Register-ScheduledTask -TaskName "GA4_アクセスレポート" -Action $action -Trigger $trigger
```
