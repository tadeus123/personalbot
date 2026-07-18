(function () {
  "use strict";

  var script =
    document.currentScript ||
    document.querySelector('script[data-bot-id][src*="embed.js"]');
  if (!script) return;

  var botId = script.getAttribute("data-bot-id");
  if (!botId) {
    console.warn("[PersonalBot] Missing data-bot-id attribute");
    return;
  }

  var appUrl = script.getAttribute("data-app-url") || "http://localhost:3000";
  appUrl = appUrl.replace(/\/$/, "");

  // Inject discovery meta tags (invisible to humans, readable by bots)
  function setMeta(name, content) {
    var existing = document.querySelector('meta[name="' + name + '"]');
    if (existing) {
      existing.setAttribute("content", content);
    } else {
      var meta = document.createElement("meta");
      meta.name = name;
      meta.content = content;
      document.head.appendChild(meta);
    }
  }

  setMeta("personalbot-id", botId);
  setMeta("personalbot-endpoint", appUrl + "/api/bots/" + botId);
  setMeta(
    "personalbot-manifest",
    appUrl + "/api/bots/" + botId + "/manifest"
  );

  // Link rel for bot discovery
  var link = document.createElement("link");
  link.rel = "personalbot";
  link.href = appUrl + "/api/bots/" + botId + "/manifest";
  document.head.appendChild(link);

  // Expose global for programmatic discovery
  window.__personalbot = {
    id: botId,
    endpoint: appUrl + "/api/bots/" + botId,
    manifest: appUrl + "/api/bots/" + botId + "/manifest",
    discover: appUrl + "/api/discover",
    version: "1.0",
  };

  // Register presence on this domain
  var domain = window.location.hostname;
  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      appUrl + "/api/beacon",
      JSON.stringify({ bot_id: botId, domain: domain })
    );
  } else {
    fetch(appUrl + "/api/beacon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bot_id: botId, domain: domain }),
      keepalive: true,
    }).catch(function () {});
  }
})();
