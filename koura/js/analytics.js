/* ===================================================================
   GA4 計測（A/Bテスト用）  -  analytics.js
   ・A案(kani-koura.html)とB案(kani-koura-light.html)を1ファイルで計測
   ・page_path で自動的にA/Bを区別＋ ab_variant パラメータも付与
   ・「丸近 公式オンラインショップ(kani-mrck.com)」への遷移を cta_click として計測
   ・購入の完了は別ドメイン(MakeShop)で起きるため、LP側の成果は「CTAクリック」で測る

   ★使い方：下の GA4_MEASUREMENT_ID を、GA4の測定ID（G-から始まる文字列）に書き換えるだけ。
=================================================================== */
(function () {
  "use strict";

  var GA4_MEASUREMENT_ID = "G-XXXXXXXXXX"; // ← ここをGA4の測定IDに書き換えてください

  // IDが未設定（プレースホルダーのまま）なら何もしない（開発時の誤計測・エラー防止）
  if (!GA4_MEASUREMENT_ID || GA4_MEASUREMENT_ID.indexOf("XXXX") !== -1) return;

  // A案/B案の判定（ファイル名に "light" が含まれればB案）
  var variant = location.pathname.indexOf("light") !== -1 ? "B_light" : "A_dark";

  // gtag.js を読み込み
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA4_MEASUREMENT_ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag("js", new Date());
  gtag("config", GA4_MEASUREMENT_ID, { ab_variant: variant });
  // ページ表示イベント（A/B別に集計しやすいよう変数を付与）
  gtag("event", "lp_view", { ab_variant: variant });

  // 購入ボタン（kani-mrck.com への遷移）クリックを計測
  document.addEventListener(
    "click",
    function (e) {
      var t = e.target;
      var a = t && t.closest ? t.closest('a[href*="kani-mrck.com"]') : null;
      if (!a) return;
      var place = a.closest(".lp-sticky")
        ? "sticky"
        : a.closest(".lp-final")
        ? "final"
        : a.closest(".lp-hero")
        ? "hero"
        : "other";
      gtag("event", "cta_click", {
        ab_variant: variant,
        cta_location: place,
        link_url: a.href
      });
    },
    true
  );
})();
