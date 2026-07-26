import { createServerFn } from "@tanstack/react-start";
import { sql } from "./db";
import { Resend } from "resend";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const oauthClient = new OAuth2Client(GOOGLE_CLIENT_ID);



// Helper to send order status emails
async function sendOrderStatusEmail(
  orderId: number,
  customerName: string,
  customerEmail: string,
  status: string,
  totalAmount: number,
  items: Array<{ name: string; quantity: number; price: number }>
) {
  const itemsHtml = items
    .map(
      (item) =>
        `<li>${item.name} x ${item.quantity} - Rs. ${(
          item.price * item.quantity
        ).toLocaleString()}</li>`
    )
    .join("");

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #fdfdfd;">
      <div style="background-color: #047857; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Nadeem Traders</h1>
        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Order Update</p>
      </div>
      <div style="padding: 20px; color: #333333; line-height: 1.6;">
        <p>Dear <strong>${customerName}</strong>,</p>
        <p>Your order <strong>#${orderId}</strong> status has been updated to: <span style="background-color: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 14px;">${status}</span></p>
        
        <h3 style="border-bottom: 2px solid #f3f4f6; padding-bottom: 8px; margin-top: 24px;">Order Summary</h3>
        <ul style="padding-left: 20px; margin-top: 10px;">
          ${itemsHtml}
        </ul>
        <p style="font-size: 16px; font-weight: bold; margin-top: 20px;">Total Amount: <span style="color: #047857;">Rs. ${totalAmount.toLocaleString()}</span></p>
        
        <div style="margin-top: 30px; padding: 15px; background-color: #f9fafb; border-radius: 8px; font-size: 12px; color: #6b7280; border-left: 4px solid #047857;">
          <strong>Order Tracking:</strong> You can track this order live on our website using Order ID: <strong>${orderId}</strong>.
          <br/><br/>
          <em style="font-size: 11px;">* Note: This email was sent to your registered address: ${customerEmail}</em>
        </div>
      </div>
      <div style="text-align: center; padding: 15px; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; margin-top: 30px;">
        &copy; ${new Date().getFullYear()} Nadeem Traders. Commercial Hub, Punjab, Pakistan.
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: "Nadeem Traders <onboarding@resend.dev>",
      to: customerEmail,
      subject: `[Order #${orderId}] Status Update: ${status}`,
      html: emailHtml,
    });
    console.log(`Email successfully sent for Order #${orderId} to ${customerEmail} with status ${status}`);
  } catch (err) {
    console.error(`Failed to send order email to ${customerEmail} via Resend:`, err);
  }

  // Admin / Store Owner Notification
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "technicalsubhan7801@gmail.com";
    await resend.emails.send({
      from: "Nadeem Traders <onboarding@resend.dev>",
      to: adminEmail,
      subject: `[Admin Alert - Order #${orderId}] Status: ${status}`,
      html: `<div style="background: #fff3cd; color: #856404; padding: 12px; border: 1px solid #ffeeba; border-radius: 6px; margin-bottom: 20px;">
        <strong>Admin Notification:</strong> This is a copy of the customer notification sent to the store owner.
      </div>` + emailHtml,
    });
    console.log(`Admin copy successfully sent to ${adminEmail} for Order #${orderId}`);
  } catch (err) {
    console.error(`Failed to send admin order email copy via Resend:`, err);
  }
}

// Helper to verify Google ID Token
async function verifyGoogleIdToken(token: string) {
  try {
    const ticket = await oauthClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) throw new Error("No payload returned from Google");
    return payload;
  } catch (err) {
    console.error("Google token verification failed:", err);
    throw new Error("Invalid Google sign-in credentials.");
  }
}

// Audit log helper
async function createAuditLog(userId: number | null, action: string, ip: string | null, details: string) {
  try {
    await sql`
      INSERT INTO audit_logs (user_id, action, ip_address, details)
      VALUES (${userId}, ${action}, ${ip}, ${details})
    `;
  } catch (e) {
    console.error("Failed to write audit log:", e);
  }
}

// 0. Complete Google Authentication
export const loginWithGoogleCredential = createServerFn({ method: "POST" })
  .validator((data: { credential: string; guestSessionId?: string; deviceInfo?: string; browser?: string; os?: string; ip?: string }) => data)
  .handler(async ({ data }) => {
    const { setSessionToken, clearGuestToken } = await import("./server-cookies");
    // 1. Verify token securely
    const payload = await verifyGoogleIdToken(data.credential);
    const email = payload.email!;
    const googleId = payload.sub;
    const name = payload.name!;
    const firstName = payload.given_name || "";
    const lastName = payload.family_name || "";
    const picture = payload.picture || "";
    const emailVerified = payload.email_verified || false;

    // 2. Check if user already exists
    let user;
    const existing = await sql`
      SELECT * FROM users WHERE google_id = ${googleId} OR email = ${email}
    `;

    if (existing.length > 0) {
      user = existing[0];
      // If user had email OTP before, update their google_id
      if (!user.google_id) {
        await sql`
          UPDATE users SET google_id = ${googleId}, updated_at = NOW() WHERE id = ${user.id}
        `;
        user.google_id = googleId;
      }
    } else {
      // 3. Register new user
      const result = await sql`
        INSERT INTO users (google_id, email, name, first_name, last_name, picture, email_verified, reward_points)
        VALUES (${googleId}, ${email}, ${name}, ${firstName}, ${lastName}, ${picture}, ${emailVerified}, 100) -- give 100 welcome reward points
        RETURNING *
      `;
      user = result[0];
      // Log account creation
      await createAuditLog(user.id, "Account Created", data.ip || null, `User registered using Google OAuth: ${email}`);
      
      // Seed first notification
      await sql`
        INSERT INTO notifications (user_id, title, message)
        VALUES (${user.id}, 'Welcome to Haraa Bazaar!', 'Thank you for registering. You have been awarded 100 welcome reward points! Start shopping and explore our fresh catalog.')
      `;
      // Seed welcome rewards history
      await sql`
        INSERT INTO rewards_history (user_id, points, action, description)
        VALUES (${user.id}, 100, 'Earned', 'Welcome bonus reward points')
      `;
    }

    // 4. Check if account is Disabled
    if (user.account_status === "Disabled") {
      await createAuditLog(user.id, "Blocked Login Attempt", data.ip || null, `Attempted login on disabled account: ${email}`);
      throw new Error("Your account has been disabled by an administrator.");
    }

    // 5. Update user activity & login metadata
    await sql`
      UPDATE users SET 
        picture = ${picture},
        name = ${name},
        first_name = ${firstName},
        last_name = ${lastName},
        email_verified = ${emailVerified},
        device_info = ${data.deviceInfo || null},
        browser_info = ${data.browser || null},
        operating_system = ${data.os || null},
        last_ip = ${data.ip || null},
        last_login = NOW(),
        last_activity = NOW(),
        updated_at = NOW()
      WHERE id = ${user.id}
    `;

    // 6. Log login event
    await sql`
      INSERT INTO login_history (user_id, ip_address, device, browser, status)
      VALUES (${user.id}, ${data.ip || null}, ${data.os || null}, ${data.browser || null}, 'Success')
    `;
    await createAuditLog(user.id, "Login", data.ip || null, `Logged in successfully via Google OAuth from ${data.os || 'Unknown OS'}`);

    // 7. Session Rotation: delete any previous active session tokens on this device or just create new session token
    const sessionToken = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days session

    await sql`
      INSERT INTO sessions (id, user_id, device_id, browser, ip_address, expires_at)
      VALUES (${sessionToken}, ${user.id}, ${data.os || null}, ${data.browser || null}, ${data.ip || null}, ${expiresAt})
    `;

    // 8. Set HTTP-only, secure, SameSite=Lax cookie
    await setSessionToken(sessionToken, expiresAt);

    // 9. Preserving guest cart & guest recently viewed
    if (data.guestSessionId) {
      // Merge guest cart items into user cart
      const guestCart = await sql`SELECT * FROM cart_items WHERE guest_session_id = ${data.guestSessionId}`;
      for (const item of guestCart) {
        await sql`
          INSERT INTO cart_items (user_id, product_id, quantity)
          VALUES (${user.id}, ${item.product_id}, ${item.quantity})
          ON CONFLICT (user_id, product_id)
          DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
        `;
      }
      await sql`DELETE FROM cart_items WHERE guest_session_id = ${data.guestSessionId}`;

      // Merge recently viewed
      const guestRV = await sql`SELECT * FROM recently_viewed WHERE guest_session_id = ${data.guestSessionId}`;
      for (const item of guestRV) {
        await sql`
          INSERT INTO recently_viewed (user_id, product_id, viewed_at)
          VALUES (${user.id}, ${item.product_id}, ${item.viewed_at})
          ON CONFLICT (user_id, product_id)
          DO UPDATE SET viewed_at = GREATEST(recently_viewed.viewed_at, EXCLUDED.viewed_at)
        `;
      }
      await sql`DELETE FROM recently_viewed WHERE guest_session_id = ${data.guestSessionId}`;

      await clearGuestToken();
    }

    return { success: true, user };
  });

// Restore persistent user session
export const restoreSession = createServerFn({ method: "POST" }).handler(async () => {
  const { getSessionToken, clearSessionToken } = await import("./server-cookies");
  const token = await getSessionToken();
  if (!token) return null;

  const sessionResult = await sql`
    SELECT * FROM sessions 
    WHERE id = ${token} AND active = TRUE AND expires_at > NOW()
  `;

  if (sessionResult.length === 0) {
    await clearSessionToken();
    return null;
  }

  const session = sessionResult[0];
  const userResult = await sql`
    SELECT * FROM users WHERE id = ${session.user_id}
  `;

  if (userResult.length === 0 || userResult[0].account_status === "Disabled") {
    // If account was disabled in database, force destroy session
    await sql`UPDATE sessions SET active = FALSE WHERE id = ${token}`;
    await clearSessionToken();
    return null;
  }

  const user = userResult[0];
  await sql`
    UPDATE users SET last_activity = NOW() WHERE id = ${user.id}
  `;

  return { success: true, user };
});

// Logout customer
export const logoutCustomer = createServerFn({ method: "POST" }).handler(async () => {
  const { getSessionToken, clearSessionToken } = await import("./server-cookies");
  const token = await getSessionToken();
  if (token) {
    const sessionResult = await sql`
      SELECT * FROM sessions WHERE id = ${token}
    `;
    if (sessionResult.length > 0) {
      const session = sessionResult[0];
      await sql`UPDATE sessions SET active = FALSE WHERE id = ${token}`;
      await createAuditLog(session.user_id, "Logout", session.ip_address, "Customer logged out explicitly");
    }
    await clearSessionToken();
  }
  return { success: true };
});

// Guest token initialization
export const getOrCreateGuestSession = createServerFn({ method: "POST" }).handler(async () => {
  const { getGuestToken, setGuestToken } = await import("./server-cookies");
  let guestToken = await getGuestToken();
  if (!guestToken) {
    guestToken = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
    await setGuestToken(guestToken);
  }
  return { guestSessionId: guestToken };
});

// Shopping Cart Actions
export const getCartItems = createServerFn({ method: "POST" })
  .validator((data: { userId?: number; guestSessionId?: string }) => data)
  .handler(async ({ data }) => {
    if (!data.userId && !data.guestSessionId) {
      const { resolveUserOrGuest } = await import("./server-cookies");
      const identity = await resolveUserOrGuest();
      data.userId = identity.userId;
      data.guestSessionId = identity.guestSessionId;
    }

    if (data.userId) {
      return await sql`
        SELECT c.id as cart_item_id, c.quantity, p.*, cat.name as category_name
        FROM cart_items c
        JOIN products p ON c.product_id = p.id
        LEFT JOIN categories cat ON p.category_id = cat.id
        WHERE c.user_id = ${data.userId}
      `;
    } else if (data.guestSessionId) {
      return await sql`
        SELECT c.id as cart_item_id, c.quantity, p.*, cat.name as category_name
        FROM cart_items c
        JOIN products p ON c.product_id = p.id
        LEFT JOIN categories cat ON p.category_id = cat.id
        WHERE c.guest_session_id = ${data.guestSessionId}
      `;
    }
    return [];
  });

export const addToCartDb = createServerFn({ method: "POST" })
  .validator((data: { userId?: number; guestSessionId?: string; productId: number; quantity: number }) => data)
  .handler(async ({ data }) => {
    if (!data.userId && !data.guestSessionId) {
      const { resolveUserOrGuest } = await import("./server-cookies");
      const identity = await resolveUserOrGuest();
      data.userId = identity.userId;
      data.guestSessionId = identity.guestSessionId;
    }

    if (data.userId) {
      await sql`
        INSERT INTO cart_items (user_id, product_id, quantity)
        VALUES (${data.userId}, ${data.productId}, ${data.quantity})
        ON CONFLICT (user_id, product_id)
        DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
      `;
    } else if (data.guestSessionId) {
      await sql`
        INSERT INTO cart_items (guest_session_id, product_id, quantity)
        VALUES (${data.guestSessionId}, ${data.productId}, ${data.quantity})
        ON CONFLICT (guest_session_id, product_id)
        DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
      `;
    }
    return { success: true };
  });

export const updateCartItemQuantityDb = createServerFn({ method: "POST" })
  .validator((data: { userId?: number; guestSessionId?: string; productId: number; quantity: number }) => data)
  .handler(async ({ data }) => {
    if (!data.userId && !data.guestSessionId) {
      const { resolveUserOrGuest } = await import("./server-cookies");
      const identity = await resolveUserOrGuest();
      data.userId = identity.userId;
      data.guestSessionId = identity.guestSessionId;
    }

    if (data.userId) {
      await sql`
        UPDATE cart_items SET quantity = ${data.quantity}
        WHERE user_id = ${data.userId} AND product_id = ${data.productId}
      `;
    } else if (data.guestSessionId) {
      await sql`
        UPDATE cart_items SET quantity = ${data.quantity}
        WHERE guest_session_id = ${data.guestSessionId} AND product_id = ${data.productId}
      `;
    }
    return { success: true };
  });

export const removeFromCartDb = createServerFn({ method: "POST" })
  .validator((data: { userId?: number; guestSessionId?: string; productId: number }) => data)
  .handler(async ({ data }) => {
    if (!data.userId && !data.guestSessionId) {
      const { resolveUserOrGuest } = await import("./server-cookies");
      const identity = await resolveUserOrGuest();
      data.userId = identity.userId;
      data.guestSessionId = identity.guestSessionId;
    }

    if (data.userId) {
      await sql`
        DELETE FROM cart_items WHERE user_id = ${data.userId} AND product_id = ${data.productId}
      `;
    } else if (data.guestSessionId) {
      await sql`
        DELETE FROM cart_items WHERE guest_session_id = ${data.guestSessionId} AND product_id = ${data.productId}
      `;
    }
    return { success: true };
  });

export const clearCartDb = createServerFn({ method: "POST" })
  .validator((data: { userId: number }) => data)
  .handler(async ({ data }) => {
    await sql`DELETE FROM cart_items WHERE user_id = ${data.userId}`;
    return { success: true };
  });

// Wishlist Actions
export const getWishlist = createServerFn({ method: "POST" })
  .validator((data: { userId: number }) => data)
  .handler(async ({ data }) => {
    return await sql`
      SELECT w.id as wishlist_item_id, p.*, cat.name as category_name
      FROM wishlist_items w
      JOIN products p ON w.product_id = p.id
      LEFT JOIN categories cat ON p.category_id = cat.id
      WHERE w.user_id = ${data.userId}
    `;
  });

export const toggleWishlistDb = createServerFn({ method: "POST" })
  .validator((data: { userId: number; productId: number }) => data)
  .handler(async ({ data }) => {
    const existing = await sql`
      SELECT * FROM wishlist_items WHERE user_id = ${data.userId} AND product_id = ${data.productId}
    `;
    if (existing.length > 0) {
      await sql`
        DELETE FROM wishlist_items WHERE user_id = ${data.userId} AND product_id = ${data.productId}
      `;
      return { success: true, wishlisted: false };
    } else {
      await sql`
        INSERT INTO wishlist_items (user_id, product_id)
        VALUES (${data.userId}, ${data.productId})
      `;
      return { success: true, wishlisted: true };
    }
  });

// Recently Viewed Actions
export const recordRecentlyViewedDb = createServerFn({ method: "POST" })
  .validator((data: { userId?: number; guestSessionId?: string; productId: number }) => data)
  .handler(async ({ data }) => {
    if (!data.userId && !data.guestSessionId) {
      const { resolveUserOrGuest } = await import("./server-cookies");
      const identity = await resolveUserOrGuest();
      data.userId = identity.userId;
      data.guestSessionId = identity.guestSessionId;
    }

    if (data.userId) {
      await sql`
        INSERT INTO recently_viewed (user_id, product_id, viewed_at)
        VALUES (${data.userId}, ${data.productId}, NOW())
        ON CONFLICT (user_id, product_id)
        DO UPDATE SET viewed_at = NOW()
      `;
    } else if (data.guestSessionId) {
      await sql`
        INSERT INTO recently_viewed (guest_session_id, product_id, viewed_at)
        VALUES (${data.guestSessionId}, ${data.productId}, NOW())
        ON CONFLICT (guest_session_id, product_id)
        DO UPDATE SET viewed_at = NOW()
      `;
    }
    return { success: true };
  });

export const getRecentlyViewed = createServerFn({ method: "POST" })
  .validator((data: { userId?: number; guestSessionId?: string }) => data)
  .handler(async ({ data }) => {
    if (!data.userId && !data.guestSessionId) {
      const { resolveUserOrGuest } = await import("./server-cookies");
      const identity = await resolveUserOrGuest();
      data.userId = identity.userId;
      data.guestSessionId = identity.guestSessionId;
    }

    if (data.userId) {
      return await sql`
        SELECT rv.viewed_at, p.*, cat.name as category_name
        FROM recently_viewed rv
        JOIN products p ON rv.product_id = p.id
        LEFT JOIN categories cat ON p.category_id = cat.id
        WHERE rv.user_id = ${data.userId}
        ORDER BY rv.viewed_at DESC
        LIMIT 12
      `;
    } else if (data.guestSessionId) {
      return await sql`
        SELECT rv.viewed_at, p.*, cat.name as category_name
        FROM recently_viewed rv
        JOIN products p ON rv.product_id = p.id
        LEFT JOIN categories cat ON p.category_id = cat.id
        WHERE rv.guest_session_id = ${data.guestSessionId}
        ORDER BY rv.viewed_at DESC
        LIMIT 12
      `;
    }
    return [];
  });

// Address Book Actions
export const getUserAddresses = createServerFn({ method: "POST" })
  .validator((data: { userId: number }) => data)
  .handler(async ({ data }) => {
    return await sql`
      SELECT * FROM user_addresses WHERE user_id = ${data.userId} ORDER BY is_default DESC, id DESC
    `;
  });

export const addUserAddressDb = createServerFn({ method: "POST" })
  .validator((data: {
    userId: number;
    type: string;
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
    isDefault: boolean;
  }) => data)
  .handler(async ({ data }) => {
    if (data.isDefault) {
      await sql`
        UPDATE user_addresses SET is_default = FALSE WHERE user_id = ${data.userId} AND type = ${data.type}
      `;
    }
    await sql`
      INSERT INTO user_addresses (user_id, type, first_name, last_name, address_line1, address_line2, city, state, postal_code, country, phone, is_default)
      VALUES (${data.userId}, ${data.type}, ${data.firstName}, ${data.lastName}, ${data.addressLine1}, ${data.addressLine2 || null}, ${data.city}, ${data.state}, ${data.postalCode}, ${data.country}, ${data.phone}, ${data.isDefault})
    `;
    return { success: true };
  });

export const deleteUserAddressDb = createServerFn({ method: "POST" })
  .validator((data: { userId: number; addressId: number }) => data)
  .handler(async ({ data }) => {
    await sql`
      DELETE FROM user_addresses WHERE id = ${data.addressId} AND user_id = ${data.userId}
    `;
    return { success: true };
  });

// Preference Actions
export const updateUserPreferences = createServerFn({ method: "POST" })
  .validator((data: { userId: number; marketingConsent: boolean; newsletterSubscription: boolean; phone?: string }) => data)
  .handler(async ({ data }) => {
    await sql`
      UPDATE users SET 
        marketing_consent = ${data.marketingConsent}, 
        newsletter_subscription = ${data.newsletterSubscription},
        phone_number = ${data.phone || null},
        updated_at = NOW()
      WHERE id = ${data.userId}
    `;
    return { success: true };
  });

// Reviews Actions
export const submitReview = createServerFn({ method: "POST" })
  .validator((data: { userId: number; productId: number; rating: number; comment: string }) => data)
  .handler(async ({ data }) => {
    const result = await sql`
      INSERT INTO reviews (user_id, product_id, rating, comment)
      VALUES (${data.userId}, ${data.productId}, ${data.rating}, ${data.comment})
      RETURNING *
    `;
    
    // Increment product review metrics
    const reviewsResult = await sql`
      SELECT count(*), avg(rating) FROM reviews WHERE product_id = ${data.productId}
    `;
    const count = parseInt(reviewsResult[0].count);
    const avgRating = parseFloat(reviewsResult[0].avg || "5.0");

    await sql`
      UPDATE products SET 
        reviews = ${count},
        rating = ${parseFloat(avgRating.toFixed(1))}
      WHERE id = ${data.productId}
    `;

    return result[0];
  });

export const getProductReviews = createServerFn({ method: "POST" })
  .validator((data: { productId: number }) => data)
  .handler(async ({ data }) => {
    return await sql`
      SELECT r.*, u.name as user_name, u.picture as user_picture
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ${data.productId}
      ORDER BY r.created_at DESC
    `;
  });

// Support Ticket Actions
export const getSupportTickets = createServerFn({ method: "POST" })
  .validator((data: { userId: number }) => data)
  .handler(async ({ data }) => {
    return await sql`
      SELECT * FROM support_tickets WHERE user_id = ${data.userId} ORDER BY id DESC
    `;
  });

export const createSupportTicket = createServerFn({ method: "POST" })
  .validator((data: { userId: number; subject: string; message: string }) => data)
  .handler(async ({ data }) => {
    await sql`
      INSERT INTO support_tickets (user_id, subject, message)
      VALUES (${data.userId}, ${data.subject}, ${data.message})
    `;
    return { success: true };
  });

// Notifications Actions
export const getUserNotifications = createServerFn({ method: "POST" })
  .validator((data: { userId: number }) => data)
  .handler(async ({ data }) => {
    return await sql`
      SELECT * FROM notifications WHERE user_id = ${data.userId} ORDER BY id DESC
    `;
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .validator((data: { userId: number; notificationId: number }) => data)
  .handler(async ({ data }) => {
    await sql`
      UPDATE notifications SET is_read = TRUE 
      WHERE id = ${data.notificationId} AND user_id = ${data.userId}
    `;
    return { success: true };
  });

// Coupons & Rewards Actions
export const getCoupons = createServerFn({ method: "GET" }).handler(async () => {
  return await sql`SELECT * FROM coupons WHERE active = TRUE`;
});

export const applyCoupon = createServerFn({ method: "POST" })
  .validator((data: { code: string }) => data)
  .handler(async ({ data }) => {
    const result = await sql`
      SELECT * FROM coupons WHERE code = ${data.code.toUpperCase()} AND active = TRUE
    `;
    if (result.length === 0) {
      throw new Error("Invalid or inactive coupon code.");
    }
    return result[0];
  });

export const getCustomerDashboardStats = createServerFn({ method: "POST" })
  .validator((data: { userId: number }) => data)
  .handler(async ({ data }) => {
    const userResult = await sql`
      SELECT created_at, reward_points, last_login FROM users WHERE id = ${data.userId}
    `;
    
    const ordersResult = await sql`
      SELECT status, count(*), sum(total_amount) as total_spent FROM orders 
      WHERE user_id = ${data.userId} 
      GROUP BY status
    `;

    const wishlistCountResult = await sql`
      SELECT count(*) FROM wishlist_items WHERE user_id = ${data.userId}
    `;

    const stats = {
      memberSince: userResult[0]?.created_at || new Date(),
      rewardPoints: userResult[0]?.reward_points || 0,
      lastLogin: userResult[0]?.last_login || new Date(),
      wishlistCount: parseInt(wishlistCountResult[0]?.count || "0"),
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      returnedOrders: 0,
      totalSpending: 0
    };

    ordersResult.forEach(row => {
      const count = parseInt(row.count);
      stats.totalOrders += count;
      stats.totalSpending += parseFloat(row.total_spent || "0");
      if (row.status === "Pending") stats.pendingOrders = count;
      else if (row.status === "Completed" || row.status === "Delivered") stats.completedOrders = count;
      else if (row.status === "Cancelled") stats.cancelledOrders = count;
      else if (row.status === "Returned") stats.returnedOrders = count;
    });

    return stats;
  });

// Admin Authentication Events & Customer Controls
export const toggleUserAccountStatus = createServerFn({ method: "POST" })
  .validator((data: { userId: number; status: string }) => data)
  .handler(async ({ data }) => {
    const { serverCache } = await import("./server-cache");
    serverCache.delete("users_list");
    await sql`
      UPDATE users SET account_status = ${data.status}, updated_at = NOW() WHERE id = ${data.userId}
    `;
    // If disabling account, delete all active sessions
    if (data.status === "Disabled") {
      await sql`UPDATE sessions SET active = FALSE WHERE user_id = ${data.userId}`;
    }
    return { success: true };
  });

export const forceResetSession = createServerFn({ method: "POST" })
  .validator((data: { userId: number }) => data)
  .handler(async ({ data }) => {
    await sql`UPDATE sessions SET active = FALSE WHERE user_id = ${data.userId}`;
    return { success: true };
  });

export const getCustomerSessionCount = createServerFn({ method: "POST" })
  .validator((data: { userId: number }) => data)
  .handler(async ({ data }) => {
    const result = await sql`
      SELECT count(*) FROM sessions WHERE user_id = ${data.userId} AND active = TRUE AND expires_at > NOW()
    `;
    return parseInt(result[0].count);
  });

export const getCustomerLoginHistory = createServerFn({ method: "POST" })
  .validator((data: { userId: number }) => data)
  .handler(async ({ data }) => {
    return await sql`
      SELECT * FROM login_history WHERE user_id = ${data.userId} ORDER BY id DESC LIMIT 20
    `;
  });

export const getCustomerAuditLogs = createServerFn({ method: "POST" })
  .validator((data: { userId: number }) => data)
  .handler(async ({ data }) => {
    return await sql`
      SELECT * FROM audit_logs WHERE user_id = ${data.userId} ORDER BY id DESC LIMIT 20
    `;
  });

// 1. Categories
export const getCategories = createServerFn({ method: "GET" }).handler(
  async () => {
    const { serverCache } = await import("./server-cache");
    const cached = serverCache.get("categories");
    if (cached) return cached;
    const res = await sql`SELECT * FROM categories ORDER BY name ASC`;
    serverCache.set("categories", res);
    return res;
  }
);

export const addCategory = createServerFn({ method: "POST" })
  .validator((data: { name: string; icon: string; image_url?: string }) => data)
  .handler(async ({ data }) => {
    const { serverCache } = await import("./server-cache");
    serverCache.delete("categories");
    const result = await sql`
      INSERT INTO categories (name, icon, image_url)
      VALUES (${data.name}, ${data.icon}, ${data.image_url || null})
      RETURNING *
    `;
    return result[0];
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .validator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    const { serverCache } = await import("./server-cache");
    serverCache.delete("categories");
    await sql`DELETE FROM categories WHERE id = ${data.id}`;
    return { success: true };
  });

export const editCategory = createServerFn({ method: "POST" })
  .validator((data: { id: number; name: string; icon: string; image_url?: string }) => data)
  .handler(async ({ data }) => {
    const { serverCache } = await import("./server-cache");
    serverCache.delete("categories");
    serverCache.delete("products"); // products reference category_name in joins
    await sql`
      UPDATE categories 
      SET name = ${data.name}, icon = ${data.icon}, image_url = ${data.image_url || null}
      WHERE id = ${data.id}
    `;
    return { success: true };
  });

// 2. Products
export const getProducts = createServerFn({ method: "GET" }).handler(
  async () => {
    const { serverCache } = await import("./server-cache");
    const cached = serverCache.get("products");
    if (cached) return cached;
    const res = await sql`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.id DESC
    `;
    serverCache.set("products", res);
    return res;
  }
);

export const addProduct = createServerFn({ method: "POST" })
  .validator(
    (data: {
      name: string;
      brand: string;
      weight: string;
      price: number;
      old_price?: number;
      discount?: number;
      emoji: string;
      stock: boolean;
      category_id: number;
      wholesale_price?: number;
      wholesale_min_qty?: number;
      image_url?: string;
    }) => data
  )
  .handler(async ({ data }) => {
    const { serverCache } = await import("./server-cache");
    serverCache.delete("products");
    const result = await sql`
      INSERT INTO products (
        name, brand, weight, price, old_price, discount, emoji, stock, category_id, wholesale_price, wholesale_min_qty, image_url
      ) VALUES (
        ${data.name}, ${data.brand}, ${data.weight}, ${data.price}, ${data.old_price || null}, ${data.discount || 0}, ${data.emoji}, ${data.stock}, ${data.category_id}, ${data.wholesale_price || null}, ${data.wholesale_min_qty || 1}, ${data.image_url || null}
      )
      RETURNING *
    `;
    return result[0];
  });

export const updateProductStock = createServerFn({ method: "POST" })
  .validator((data: { id: number; stock: boolean }) => data)
  .handler(async ({ data }) => {
    const { serverCache } = await import("./server-cache");
    serverCache.delete("products");
    await sql`UPDATE products SET stock = ${data.stock} WHERE id = ${data.id}`;
    return { success: true };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .validator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    const { serverCache } = await import("./server-cache");
    serverCache.delete("products");
    await sql`DELETE FROM products WHERE id = ${data.id}`;
    return { success: true };
  });

export const editProduct = createServerFn({ method: "POST" })
  .validator(
    (data: {
      id: number;
      name: string;
      brand: string;
      weight: string;
      price: number;
      old_price?: number;
      discount?: number;
      emoji: string;
      stock: boolean;
      category_id: number;
      wholesale_price?: number;
      wholesale_min_qty?: number;
      image_url?: string;
    }) => data
  )
  .handler(async ({ data }) => {
    const { serverCache } = await import("./server-cache");
    serverCache.delete("products");
    await sql`
      UPDATE products
      SET
        name = ${data.name},
        brand = ${data.brand},
        weight = ${data.weight},
        price = ${data.price},
        old_price = ${data.old_price || null},
        discount = ${data.discount || 0},
        emoji = ${data.emoji},
        stock = ${data.stock},
        category_id = ${data.category_id},
        wholesale_price = ${data.wholesale_price || null},
        wholesale_min_qty = ${data.wholesale_min_qty || 1},
        image_url = ${data.image_url || null}
      WHERE id = ${data.id}
    `;
    return { success: true };
  });

// 3. Brands
export const getBrands = createServerFn({ method: "GET" }).handler(async () => {
  const { serverCache } = await import("./server-cache");
  const cached = serverCache.get("brands");
  if (cached) return cached;
  const res = await sql`SELECT * FROM brands ORDER BY name ASC`;
  serverCache.set("brands", res);
  return res;
});

export const addBrand = createServerFn({ method: "POST" })
  .validator((data: { name: string; image_url?: string }) => data)
  .handler(async ({ data }) => {
    const { serverCache } = await import("./server-cache");
    serverCache.delete("brands");
    const result = await sql`
      INSERT INTO brands (name, image_url)
      VALUES (${data.name}, ${data.image_url || null})
      RETURNING *
    `;
    return result[0];
  });

export const deleteBrand = createServerFn({ method: "POST" })
  .validator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    const { serverCache } = await import("./server-cache");
    serverCache.delete("brands");
    await sql`DELETE FROM brands WHERE id = ${data.id}`;
    return { success: true };
  });

export const editBrand = createServerFn({ method: "POST" })
  .validator((data: { id: number; name: string; image_url?: string }) => data)
  .handler(async ({ data }) => {
    const { serverCache } = await import("./server-cache");
    serverCache.delete("brands");
    await sql`
      UPDATE brands 
      SET name = ${data.name}, image_url = ${data.image_url || null}
      WHERE id = ${data.id}
    `;
    return { success: true };
  });

// 4. Orders
export const createOrder = createServerFn({ method: "POST" })
  .validator(
    (data: {
      user_id?: number;
      customer_name: string;
      customer_email: string;
      customer_phone?: string;
      shipping_address: string;
      total_amount: number;
      items: Array<{
        product_id: number;
        product_name: string;
        quantity: number;
        price: number;
      }>;
    }) => data
  )
  .handler(async ({ data }) => {
    const { serverCache } = await import("./server-cache");
    serverCache.delete("orders_list");
    // Start transaction to insert order and order items
    const result = await sql.begin(async (tx) => {
      // 1. Insert order
      const order = await tx`
        INSERT INTO orders (
          user_id, customer_name, customer_email, customer_phone, shipping_address, total_amount, status
        ) VALUES (
          ${data.user_id || null}, ${data.customer_name}, ${data.customer_email}, ${data.customer_phone || null}, ${data.shipping_address}, ${data.total_amount}, 'Pending'
        ) RETURNING *
      `;
      const orderId = order[0].id;

      // 2. Insert order items
      for (const item of data.items) {
        await tx`
          INSERT INTO order_items (
            order_id, product_id, product_name, quantity, price
          ) VALUES (
            ${orderId}, ${item.product_id}, ${item.product_name}, ${item.quantity}, ${item.price}
          )
        `;
      }

      return order[0];
    });

    // Send confirmation email asynchronously via Resend
    sendOrderStatusEmail(
      result.id,
      data.customer_name,
      data.customer_email,
      "Pending (COD Received)",
      data.total_amount,
      data.items.map((i) => ({
        name: i.product_name,
        quantity: i.quantity,
        price: i.price,
      }))
    ).catch(console.error);

    return result;
  });

export const getOrders = createServerFn({ method: "GET" }).handler(async () => {
  const { serverCache } = await import("./server-cache");
  const cached = serverCache.get("orders_list");
  if (cached) return cached;

  const orders = await sql`
    SELECT * FROM orders ORDER BY id DESC
  `;
  const orderItems = await sql`
    SELECT * FROM order_items
  `;

  // Group items by order_id
  const itemsMap = new Map();
  for (const item of orderItems) {
    if (!itemsMap.has(item.order_id)) {
      itemsMap.set(item.order_id, []);
    }
    itemsMap.get(item.order_id).push(item);
  }

  const res = orders.map((o) => ({
    ...o,
    items: itemsMap.get(o.id) || [],
  }));
  serverCache.set("orders_list", res);
  return res;
});

export const updateOrderStatus = createServerFn({ method: "POST" })
  .validator((data: { id: number; status: string }) => data)
  .handler(async ({ data }) => {
    const { serverCache } = await import("./server-cache");
    serverCache.delete("orders_list");
    // 1. Update status
    const order = await sql`
      UPDATE orders
      SET status = ${data.status}
      WHERE id = ${data.id}
      RETURNING *
    `;

    if (order.length === 0) {
      throw new Error("Order not found");
    }

    // 2. Get order items
    const items = await sql`
      SELECT product_name as name, quantity, price
      FROM order_items
      WHERE order_id = ${data.id}
    `;

    // 3. Send email notifying status update
    sendOrderStatusEmail(
      order[0].id,
      order[0].customer_name,
      order[0].customer_email,
      data.status,
      order[0].total_amount,
      items as any
    ).catch(console.error);

    return order[0];
  });

export const getOrderStatus = createServerFn({ method: "GET" })
  .validator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    const order = await sql`
      SELECT * FROM orders WHERE id = ${data.id}
    `;

    if (order.length === 0) {
      return null;
    }

    const items = await sql`
      SELECT * FROM order_items WHERE order_id = ${data.id}
    `;

    return {
      ...order[0],
      items,
    };
  });

export const getUsers = createServerFn({ method: "GET" }).handler(async () => {
  const { serverCache } = await import("./server-cache");
  const cacheKey = "users_list";
  const cached = serverCache.get(cacheKey);
  if (cached) return cached;
  const res = await sql`
    SELECT * FROM users ORDER BY created_at DESC
  `;
  serverCache.set(cacheKey, res);
  return res;
});

export const sendVerificationEmail = createServerFn({ method: "POST" })
  .validator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Save to database
    await sql`
      INSERT INTO verification_codes (email, code, expires_at)
      VALUES (${data.email}, ${code}, ${expiresAt})
    `;

    console.log(`[VERIFICATION CODE GENERATED] Email: ${data.email}, Code: ${code}`);

    try {
      await resend.emails.send({
        from: "Nadeem Traders <onboarding@resend.dev>",
        to: data.email,
        subject: "Verify Your Email Address — Nadeem Traders",
        html: `
          <div style="font-family: sans-serif; padding: 20px; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff;">
            <h2 style="color: #2E7D32; margin-top: 0;">Nadeem Traders</h2>
            <p style="font-size: 14px; color: #334155;">Thank you for registering at Nadeem Traders. Please use the verification code below to verify your email address:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; padding: 16px; background: #e8f5e9; text-align: center; color: #1b5e20; border-radius: 8px; margin: 20px 0; border: 1px solid #c8e6c9;">
              ${code}
            </div>
            <p style="font-size: 12px; color: #64748b; line-height: 1.5;">This code will expire in 15 minutes. If you did not make this request, please disregard this email.</p>
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
            <p style="font-size: 10px; color: #94a3b8; text-align: center;">&copy; ${new Date().getFullYear()} Nadeem Traders. All rights reserved.</p>
          </div>
        `
      });
      return { success: true };
    } catch (err: any) {
      console.error(`Resend failed to send verification email to ${data.email}:`, err);
      // For local testing (Resend API key restriction), we return success and pass the code in dev mode to avoid blocking developer testing
      return { 
        success: true, 
        warning: "Resend Sandbox Mode: Verification code sent. Since Resend sandbox is restricted to test emails, we logged it. Code is " + code,
        mockCode: process.env.NODE_ENV !== "production" ? code : undefined 
      };
    }
  });

export const verifyEmailCodeAndLogin = createServerFn({ method: "POST" })
  .validator((data: { email: string; code: string; username?: string; guestSessionId?: string; deviceInfo?: string; browser?: string; os?: string; ip?: string }) => data)
  .handler(async ({ data }) => {
    const { setSessionToken } = await import("./server-cookies");

    // 1. Verify code matches and not expired
    const match = await sql`
      SELECT * FROM verification_codes 
      WHERE email = ${data.email} AND code = ${data.code} AND expires_at > NOW()
      ORDER BY created_at DESC LIMIT 1
    `;

    if (match.length === 0) {
      throw new Error("Invalid or expired verification code. Please try again.");
    }

    // Delete verification codes for this email
    await sql`DELETE FROM verification_codes WHERE email = ${data.email}`;

    // 2. Check if user already exists
    let user;
    const existing = await sql`SELECT * FROM users WHERE email = ${data.email}`;

    if (existing.length > 0) {
      user = existing[0];
      // Update verified status if not set
      if (!user.email_verified) {
        await sql`UPDATE users SET email_verified = true, updated_at = NOW() WHERE id = ${user.id}`;
        user.email_verified = true;
      }
    } else {
      // 3. Register new user
      const name = data.username || data.email.split("@")[0];
      const result = await sql`
        INSERT INTO users (email, name, email_verified, reward_points)
        VALUES (${data.email}, ${name}, true, 100) -- welcome 100 reward points
        RETURNING *
      `;
      user = result[0];
      
      // Seed first notification & welcome rewards
      await sql`
        INSERT INTO notifications (user_id, title, message)
        VALUES (${user.id}, 'Welcome to Nadeem Traders!', 'Thank you for verifying your email. You have been awarded 100 welcome reward points! Start shopping and explore our fresh catalog.')
      `;
      await sql`
        INSERT INTO rewards_history (user_id, points, action, description)
        VALUES (${user.id}, 100, 'Earned', 'Welcome bonus reward points')
      `;
    }

    // 4. Update activity metadata
    await sql`
      UPDATE users SET 
        device_info = ${data.deviceInfo || null},
        browser_info = ${data.browser || null},
        operating_system = ${data.os || null},
        last_ip = ${data.ip || null},
        last_login = NOW(),
        last_activity = NOW(),
        updated_at = NOW()
      WHERE id = ${user.id}
    `;

    // 5. Audit logs
    await sql`
      INSERT INTO login_history (user_id, ip_address, device, browser, status)
      VALUES (${user.id}, ${data.ip || null}, ${data.os || null}, ${data.browser || null}, 'Success')
    `;

    // 6. Create session
    const sessionToken = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days session

    await sql`
      INSERT INTO sessions (id, user_id, device_id, browser, ip_address, expires_at)
      VALUES (${sessionToken}, ${user.id}, ${data.os || null}, ${data.browser || null}, ${data.ip || null}, ${expiresAt})
    `;

    // Set cookie
    await setSessionToken(sessionToken, expiresAt);

    // 7. Preserving guest cart & guest recently viewed
    if (data.guestSessionId) {
      // Merge guest cart items into user cart
      const guestCart = await sql`SELECT * FROM cart_items WHERE guest_session_id = ${data.guestSessionId}`;
      for (const item of guestCart) {
        await sql`
          INSERT INTO cart_items (user_id, product_id, quantity)
          VALUES (${user.id}, ${item.product_id}, ${item.quantity})
          ON CONFLICT (user_id, product_id)
          DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
        `;
      }
      await sql`DELETE FROM cart_items WHERE guest_session_id = ${data.guestSessionId}`;

      // Merge recently viewed
      const guestRV = await sql`SELECT * FROM recently_viewed WHERE guest_session_id = ${data.guestSessionId}`;
      for (const item of guestRV) {
        await sql`
          INSERT INTO recently_viewed (user_id, product_id, viewed_at)
          VALUES (${user.id}, ${item.product_id}, ${item.viewed_at})
          ON CONFLICT (user_id, product_id)
          DO UPDATE SET viewed_at = GREATEST(recently_viewed.viewed_at, EXCLUDED.viewed_at)
        `;
      }
      await sql`DELETE FROM recently_viewed WHERE guest_session_id = ${data.guestSessionId}`;
    }

    return { success: true, user };
  });
