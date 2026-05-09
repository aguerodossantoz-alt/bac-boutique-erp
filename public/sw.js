self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};

  event.waitUntil(
    self.registration.showNotification(data.title || "BAC Boutique ERP", {
      body: data.body || "Новая продажа",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: {
        url: data.url || "/sales",
      },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetPath = event.notification?.data?.url || "/sales";
  const targetUrl = new URL(targetPath, self.location.origin).toString();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      return clients.openWindow(targetUrl);
    })
  );
});
