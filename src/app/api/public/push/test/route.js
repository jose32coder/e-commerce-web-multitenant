import webpush from "web-push";

const getVapidConfig = () => {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject =
    process.env.VAPID_SUBJECT?.trim() || "mailto:admin@deployshop.local";

  if (!publicKey || !privateKey) {
    return {
      error:
        "Faltan NEXT_PUBLIC_VAPID_PUBLIC_KEY o VAPID_PRIVATE_KEY en variables de entorno.",
    };
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return { publicKey, privateKey, subject };
};

export async function POST(request) {
  try {
    const { subscription, tenantId } = await request.json();

    if (!subscription?.endpoint || !subscription?.keys?.auth || !subscription?.keys?.p256dh) {
      return Response.json(
        { error: "Suscripción push inválida o incompleta." },
        { status: 400 },
      );
    }

    const vapidConfig = getVapidConfig();
    if (vapidConfig.error) {
      return Response.json({ error: vapidConfig.error }, { status: 500 });
    }

    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: "Notificación de prueba",
        body: "El canal push está funcionando correctamente.",
        tag: `push-test-${tenantId || "global"}`,
        url: "/",
        data: { tenantId: tenantId || "global", type: "push_test" },
      }),
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error("[Push Test] Error enviando notificación:", error);
    return Response.json(
      {
        error:
          error?.body ||
          error?.message ||
          "No se pudo enviar la notificación de prueba.",
      },
      { status: 500 },
    );
  }
}
