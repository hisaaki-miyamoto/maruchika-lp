# -*- coding: utf-8 -*-
"""
GA4 アクセスレポート（単一LP用）
  指定したLP（既定：/koura/）の アクセス数 を GA4 Data API で取得して表示する。
  ・期間内の セッション / ユーザー / ページビュー / 平均エンゲージ時間 / CTAクリック
  ・日別の推移（簡易）

前提（初回のみ）:
  1) Google Cloud で「Google Analytics Data API」を有効化
  2) サービスアカウントを作成し、JSONキーをDL（tools/secrets/ga4-sa.json に配置）
  3) GA4 管理 > プロパティのアクセス管理 で、そのサービスアカウントを「閲覧者」に追加
  4) pip install google-analytics-data
  5) 環境変数を設定（PowerShell例）:
       $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\\Users\\maruc\\Claude\\lp\\tools\\secrets\\ga4-sa.json"
       $env:GA4_PROPERTY_ID = "123456789"   # GA4プロパティID（数字。測定IDのG-... とは別物）

実行:
  python tools/ga4_access_report.py            # 直近14日
  python tools/ga4_access_report.py 28         # 直近28日
  # 別LPを見るとき（例 /osechi/）:
  #   $env:GA4_PAGE_PATH = "/osechi/" ; python tools/ga4_access_report.py
"""

import os
import sys
import datetime

PROPERTY_ID = os.environ.get("GA4_PROPERTY_ID", "")
PAGE_PATH = os.environ.get("GA4_PAGE_PATH", "/koura/")  # 対象LPのパス（前方一致）
CTA_EVENT = os.environ.get("GA4_CTA_EVENT", "cta_click")
DAYS = int(sys.argv[1]) if len(sys.argv) > 1 else 14
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "reports")


def _client_and_types():
    try:
        from google.analytics.data_v1beta import BetaAnalyticsDataClient
        from google.analytics.data_v1beta.types import (
            RunReportRequest, Dimension, Metric, DateRange, Filter,
            FilterExpression, FilterExpressionList, OrderBy,
        )
    except ImportError:
        print("【エラー】ライブラリ未導入です。先に実行してください:\n  pip install google-analytics-data")
        sys.exit(1)
    if not PROPERTY_ID:
        print("【エラー】環境変数 GA4_PROPERTY_ID が未設定です（GA4プロパティの数値ID）。")
        sys.exit(1)
    if not os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        print("【エラー】環境変数 GOOGLE_APPLICATION_CREDENTIALS（サービスアカウントJSONのパス）が未設定です。")
        sys.exit(1)
    return BetaAnalyticsDataClient(), (RunReportRequest, Dimension, Metric, DateRange,
                                       Filter, FilterExpression, FilterExpressionList, OrderBy)


def main():
    client, T = _client_and_types()
    (RunReportRequest, Dimension, Metric, DateRange,
     Filter, FilterExpression, FilterExpressionList, OrderBy) = T

    start = (datetime.date.today() - datetime.timedelta(days=DAYS)).isoformat()
    end = datetime.date.today().isoformat()
    date_range = DateRange(start_date=start, end_date=end)
    prop = f"properties/{PROPERTY_ID}"

    path_filter = FilterExpression(filter=Filter(
        field_name="pagePath",
        string_filter=Filter.StringFilter(
            value=PAGE_PATH,
            match_type=Filter.StringFilter.MatchType.BEGINS_WITH),
    ))

    # ① 合計（セッション・ユーザー・PV・平均エンゲージ時間）
    r1 = client.run_report(RunReportRequest(
        property=prop, date_ranges=[date_range], dimension_filter=path_filter,
        metrics=[Metric(name="sessions"), Metric(name="totalUsers"),
                 Metric(name="screenPageViews"), Metric(name="averageSessionDuration")],
    ))
    sess = users = pv = 0
    avgdur = 0.0
    if r1.rows:
        m = r1.rows[0].metric_values
        sess, users, pv = int(m[0].value), int(m[1].value), int(m[2].value)
        avgdur = float(m[3].value)

    # ② CTAクリック数
    cta_filter = FilterExpression(and_group=FilterExpressionList(expressions=[
        path_filter,
        FilterExpression(filter=Filter(field_name="eventName",
                                       string_filter=Filter.StringFilter(value=CTA_EVENT))),
    ]))
    r2 = client.run_report(RunReportRequest(
        property=prop, date_ranges=[date_range], dimension_filter=cta_filter,
        metrics=[Metric(name="eventCount")],
    ))
    cta = int(r2.rows[0].metric_values[0].value) if r2.rows else 0

    # ③ 日別の推移
    r3 = client.run_report(RunReportRequest(
        property=prop, date_ranges=[date_range], dimension_filter=path_filter,
        dimensions=[Dimension(name="date")],
        metrics=[Metric(name="sessions"), Metric(name="screenPageViews")],
        order_bys=[OrderBy(dimension=OrderBy.DimensionOrderBy(dimension_name="date"))],
    ))

    ctr = (cta / sess * 100) if sess else 0.0
    mm = int(avgdur // 60); ss = int(avgdur % 60)

    lines = []
    lines.append("# 甲羅盛りLP アクセスレポート")
    lines.append(f"対象ページ：{PAGE_PATH}（前方一致）")
    lines.append(f"対象期間　：{start} 〜 {end}（直近{DAYS}日）\n")
    lines.append("■ 合計")
    lines.append(f"  アクセス（セッション）：{sess:,}")
    lines.append(f"  ユーザー数　　　　　　：{users:,}")
    lines.append(f"  ページビュー（PV）　　：{pv:,}")
    lines.append(f"  平均滞在時間　　　　　：{mm}分{ss}秒")
    lines.append(f"  購入ボタンのクリック　：{cta:,}（クリック率 {ctr:.1f}%）\n")
    lines.append("■ 日別の推移（日付：セッション / PV）")
    for row in r3.rows:
        d = row.dimension_values[0].value
        d = f"{d[0:4]}-{d[4:6]}-{d[6:8]}"
        s = row.metric_values[0].value
        p = row.metric_values[1].value
        lines.append(f"  {d}： {s} / {p}")
    report = "\n".join(lines)

    print(report)
    os.makedirs(OUT_DIR, exist_ok=True)
    out = os.path.join(OUT_DIR, f"ga4-access-{datetime.date.today().isoformat()}.md")
    with open(out, "w", encoding="utf-8") as f:
        f.write(report)
    print(f"\n（レポートを保存しました：{out}）")


if __name__ == "__main__":
    main()
