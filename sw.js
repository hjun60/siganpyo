// ─── 버전 변경 시 캐시가 자동 갱신됩니다 ───────────────────────────
const CACHE_VERSION = "v4";
const CACHE_NAME    = `luna-siganpyo-${CACHE_VERSION}`;

// 반드시 캐시할 핵심 파일 (오프라인에서도 앱이 열려야 하는 것들)
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/icon-512.png",
  "/manifest.json",
];

// 외부 CDN: 캐시되면 좋지만 실패해도 설치 중단 안 함
const OPTIONAL_ASSETS = [
  "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap",
  "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
];

// ─── 설치 ─────────────────────────────────────────────────────────
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 핵심 파일: 반드시 캐시 (실패 시 설치 실패)
      await cache.addAll(CORE_ASSETS);

      // 선택 파일: 개별 시도, 실패해도 무시
      await Promise.allSettled(
        OPTIONAL_ASSETS.map((url) =>
          fetch(url, { mode: "no-cors" })
            .then((res) => cache.put(url, res))
            .catch(() => {})
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ─── 활성화: 이전 버전 캐시 삭제 ─────────────────────────────────
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("luna-siganpyo-") && k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── 요청 처리 ────────────────────────────────────────────────────
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);

  // 1. 같은 오리진(내 사이트 파일): Cache First → 네트워크 fallback
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;

        return fetch(e.request)
          .then((res) => {
            // 정상 응답이면 캐시에도 저장
            if (res && res.status === 200) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
            }
            return res;
          })
          .catch(() => {
            // 오프라인이고 캐시도 없을 때 → index.html 반환
            return caches.match("/index.html");
          });
      })
    );
    return;
  }

  // 2. 외부 CDN(폰트, 라이브러리): Cache First → 네트워크 → 조용히 실패
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;

      return fetch(e.request)
        .then((res) => {
          // opaque(no-cors) 응답도 캐시 허용
          if (res) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => {
          // 오프라인 + 캐시 없음 → 그냥 실패 (앱 자체는 동작)
          return new Response("", { status: 408 });
        });
    })
  );
});
