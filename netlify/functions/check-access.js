const { db, json, verifySession } = require("./_auth");

exports.handler = async (event) => {
  const session = verifySession(event);
  if (!session?.user_id) {
    return json(401, { access: false, reason: "login_required" });
  }

  try {
    const rows = await db.sql`
      select status, current_period_end
      from subscriptions
      where user_id = ${session.user_id}
      order by updated_at desc
      limit 1
    `;
    const subscription = rows[0];

    if (subscription?.status === "active" && new Date(subscription.current_period_end).getTime() > Date.now()) {
      return json(200, { access: true });
    }

    return json(402, {
      access: false,
      reason: subscription ? "subscription_inactive" : "payment_required",
      status: subscription?.status || null,
    });
  } catch (error) {
    console.error("check_access_failed", error);
    return json(500, { access: false, reason: "service_unavailable" });
  }
};
