// خدمة بسيطة مطلوبة عشان الموبايل يعتبر الموقع تطبيق ويظهره في قايمة المشاركة
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
