/* ===================================================================
   GA4 アクセス計測  -  analytics.js
   ・ページビュー（アクセス数：セッション/ユーザー/PV）を計測
   ・「丸近 公式オンラインショップ(kani-mrck.com)」への遷移を cta_click として計測
=================================================================== */
(function () {
  "use strict";

  var GA4_MEASUREMENT_ID = "G-M81PY5TNWF"; // GA4 測定ID（丸近LP）

  if (!GA4_MEASUREMENT_ID || GA4_MEASUREMENT_ID.indexOf("XXXX") !== -1) return;

  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA4_MEASUREMENT_ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag("js", new Date());
  gtag("config", GA4_MEASUREMENT_ID);

  // 購入ボタン（kani-mrck.com への遷移）クリックを計測
  document.addEventListener(
    "click",
    function (e) {
      var t = e.target;
      var a = t && t.closest ? t.closest('a[href*="kani-mrck.com"]') : null;
      if (!a) return;
      var place = a.closest(".float-cta")
        ? "float"
        : a.closest(".float-tools")
        ? "float-tools"
        : a.closest(".cta")
        ? "final"
        : a.closest(".hero")
        ? "hero"
        : a.closest(".site-footer")
        ? "footer"
        : "other";
      gtag("event", "cta_click", { cta_location: place, link_url: a.href });
    },
    true
  );
})();
