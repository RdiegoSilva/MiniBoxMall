/* PesaCerto — funciona sem internet. Mude a versão abaixo quando publicar mudanças grandes. */
var V = "pesacerto-v3";
var LOCAL = ["./","index.html","styles.css","script.js","extras.js","theme.js","tutorial.html","tutorial.css","tutorial.js","manifest.webmanifest","logo.png","icon-192.png","icon-512.png"];
var CDN = ["https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js","https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(V).then(function(c){
    return Promise.all(LOCAL.concat(CDN).map(function(u){ return c.add(u).catch(function(){}); }));
  }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){ return k !== V; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener("fetch", function(e){
  var r = e.request;
  if(r.method !== "GET") return;
  var mesmo = new URL(r.url).origin === location.origin;
  if(mesmo){
    // arquivos do site: tenta a rede (pega atualizações) e cai no cache se estiver offline
    e.respondWith(fetch(r).then(function(res){
      var cp = res.clone(); caches.open(V).then(function(c){ c.put(r, cp); }); return res;
    }).catch(function(){ return caches.match(r).then(function(m){ return m || caches.match("index.html"); }); }));
  } else {
    // bibliotecas e fontes: cache primeiro
    e.respondWith(caches.match(r).then(function(m){
      return m || fetch(r).then(function(res){
        var cp = res.clone(); caches.open(V).then(function(c){ c.put(r, cp); }); return res;
      });
    }));
  }
});
