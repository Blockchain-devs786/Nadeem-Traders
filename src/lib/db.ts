import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set. Please check your .env file.");
}

// Initialize connection
export const sql = postgres(DATABASE_URL, {
  ssl: "require",
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export async function initDb() {
  console.log("Initializing database tables...");
  try {
    // 1. Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        picture TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // 2. Categories table
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        icon TEXT NOT NULL,
        image_url TEXT
      )
    `;

    // 3. Products table
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        brand TEXT NOT NULL,
        weight TEXT NOT NULL,
        price INTEGER NOT NULL,
        old_price INTEGER,
        rating NUMERIC(3, 1) DEFAULT 5.0,
        reviews INTEGER DEFAULT 0,
        discount INTEGER DEFAULT 0,
        emoji TEXT NOT NULL DEFAULT '🌾',
        stock BOOLEAN DEFAULT TRUE,
        category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
        wholesale_price INTEGER,
        wholesale_min_qty INTEGER DEFAULT 1,
        image_url TEXT
      )
    `;

    // 4. Brands table
    await sql`
      CREATE TABLE IF NOT EXISTS brands (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        image_url TEXT
      )
    `;

    // 5. Orders table
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        customer_email TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        shipping_address TEXT NOT NULL,
        total_amount INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // 6. Order Items table
    await sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price INTEGER NOT NULL
      )
    `;

    // 7. Verification Codes table (OTP login)
    await sql`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `;

    // Alterations in case tables existed prior
    await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT`;
    await sql`ALTER TABLE brands ADD COLUMN IF NOT EXISTS image_url TEXT`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL`;

    // Start order IDs from 100000 (more than 5 digits)
    try {
      await sql`ALTER SEQUENCE IF EXISTS orders_id_seq RESTART WITH 100000`;
    } catch (e) {
      console.warn("Could not alter sequence orders_id_seq:", e);
    }

    // Alterations for Google authentication & Customer Profile customization
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS shipping_address TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_address TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Pakistan'`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS state TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reward_points INTEGER DEFAULT 0`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS newsletter_subscription BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'Active'`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS device_info TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS browser_info TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS operating_system TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_ip TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`;

    // 8. Sessions Table
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        device_id TEXT,
        browser TEXT,
        ip_address TEXT,
        login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        active BOOLEAN DEFAULT TRUE
      )
    `;

    // 9. User Addresses Table (Support multiple shipping/billing addresses)
    await sql`
      CREATE TABLE IF NOT EXISTS user_addresses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL, -- 'shipping' or 'billing'
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        address_line1 TEXT NOT NULL,
        address_line2 TEXT,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        postal_code TEXT NOT NULL,
        country TEXT NOT NULL DEFAULT 'Pakistan',
        phone TEXT NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // 10. Payment Methods Table
    await sql`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        token TEXT NOT NULL,
        last_four TEXT NOT NULL,
        card_brand TEXT NOT NULL,
        expiry TEXT NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // 11. Login History Table
    await sql`
      CREATE TABLE IF NOT EXISTS login_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ip_address TEXT,
        device TEXT,
        browser TEXT,
        status TEXT NOT NULL
      )
    `;

    // 12. Notifications Table
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // 13. Audit Logs Table
    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        ip_address TEXT,
        details TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // 14. Reviews Table
    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // 15. Support Tickets Table
    await sql`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Open',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // 16. Rewards History Table
    await sql`
      CREATE TABLE IF NOT EXISTS rewards_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        points INTEGER NOT NULL,
        action TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // 17. Coupons Table
    await sql`
      CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        discount_percent INTEGER NOT NULL,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // 18. Coupon Usages Table
    await sql`
      CREATE TABLE IF NOT EXISTS coupon_usages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        coupon_id INTEGER NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // 19. Cart Items Table (Support guest checkout)
    await sql`
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        guest_session_id TEXT,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT user_or_guest CHECK (user_id IS NOT NULL OR guest_session_id IS NOT NULL),
        UNIQUE(user_id, product_id),
        UNIQUE(guest_session_id, product_id)
      )
    `;

    // 20. Wishlist Items Table
    await sql`
      CREATE TABLE IF NOT EXISTS wishlist_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, product_id)
      )
    `;

    // 21. Recently Viewed Table (Support guest and user views)
    await sql`
      CREATE TABLE IF NOT EXISTS recently_viewed (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        guest_session_id TEXT,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT user_or_guest_rv CHECK (user_id IS NOT NULL OR guest_session_id IS NOT NULL),
        UNIQUE(user_id, product_id),
        UNIQUE(guest_session_id, product_id)
      )
    `;

    console.log("Tables created/altered successfully.");

    // Seeding if tables are empty
    const categoryCount = await sql`SELECT count(*) FROM categories`;
    if (parseInt(categoryCount[0].count) === 0) {
      console.log("Seeding categories...");
      const categoriesSeed = [
        { icon: "🌶️", name: "Spices" },
        { icon: "🌾", name: "Rice" },
        { icon: "🌾", name: "Atta" },
        { icon: "🥜", name: "Pulses" },
        { icon: "🧂", name: "Salt & Sugar" },
        { icon: "🛢️", name: "Oil & Ghee" },
        { icon: "🥛", name: "Dairy" },
        { icon: "🥤", name: "Beverages" },
        { icon: "🍪", name: "Snacks" },
        { icon: "🍫", name: "Chocolates" },
        { icon: "🍜", name: "Noodles" },
        { icon: "🧴", name: "Personal Care" },
        { icon: "🧹", name: "Household" },
        { icon: "🧺", name: "Cleaning" },
        { icon: "🐔", name: "Meat" },
        { icon: "🐟", name: "Seafood" },
        { icon: "🥚", name: "Eggs" },
        { icon: "🌰", name: "Dry Fruits" },
        { icon: "🥜", name: "Nuts" },
        { icon: "🌽", name: "Animal Feed" },
        { icon: "🏪", name: "Gala Mandi" },
      ];

      for (const cat of categoriesSeed) {
        await sql`
          INSERT INTO categories (name, icon) VALUES (${cat.name}, ${cat.icon})
          ON CONFLICT (name) DO NOTHING
        `;
      }
    }

    const brandCount = await sql`SELECT count(*) FROM brands`;
    if (parseInt(brandCount[0].count) === 0) {
      console.log("Seeding brands...");
      const brandsSeed = [
        "Shan", "National", "Tapal", "Lipton", "Dalda", "Sufi", "Guard", "Olper's", "Nestlé", "Knorr", "Mitchell's", "Everyday"
      ];
      for (const name of brandsSeed) {
        await sql`
          INSERT INTO brands (name) VALUES (${name})
          ON CONFLICT (name) DO NOTHING
        `;
      }
    }

    const productCount = await sql`SELECT count(*) FROM products`;
    if (parseInt(productCount[0].count) === 0) {
      console.log("Seeding products...");
      const dbCategories = await sql`SELECT id, name FROM categories`;
      const catMap = new Map(dbCategories.map(c => [c.name, c.id]));

      const productsSeed = [
        // Standard Featured Products
        { name: "Basmati Rice Super Kernel", brand: "Guard", weight: "5 KG", price: 2450, old_price: 2999, rating: 4.8, reviews: 1204, discount: 18, emoji: "🌾", stock: true, category: "Rice" },
        { name: "Chakki Fresh Atta", brand: "Sufi", weight: "10 KG", price: 1590, old_price: 1850, rating: 4.7, reviews: 892, discount: 14, emoji: "🌾", stock: true, category: "Atta" },
        { name: "Cooking Oil Tin", brand: "Dalda", weight: "5 Ltr", price: 3299, old_price: 3899, rating: 4.9, reviews: 2103, discount: 15, emoji: "🛢️", stock: true, category: "Oil & Ghee" },
        { name: "Chilli Powder", brand: "Shan", weight: "400 g", price: 420, old_price: 520, rating: 4.6, reviews: 640, discount: 19, emoji: "🌶️", stock: true, category: "Spices" },
        { name: "Full Cream Milk", brand: "Olper's", weight: "1 Ltr", price: 320, old_price: 350, rating: 4.5, reviews: 415, discount: 8, emoji: "🥛", stock: true, category: "Dairy" },
        { name: "Danedar Tea", brand: "Tapal", weight: "950 g", price: 1780, old_price: 1990, rating: 4.7, reviews: 998, discount: 10, emoji: "🍵", stock: true, category: "Beverages" },
        { name: "Masoor Daal", brand: "National", weight: "1 KG", price: 480, old_price: 560, rating: 4.6, reviews: 302, discount: 14, emoji: "🥜", stock: true, category: "Pulses" },
        { name: "Vermicelli", brand: "Mitchell's", weight: "150 g", price: 145, old_price: 170, rating: 4.4, reviews: 178, discount: 15, emoji: "🍜", stock: false, category: "Noodles" },
        
        // Wholesale / Bulk Products
        { name: "Red Chilli (Surkh Mirch)", brand: "Shan", weight: "1 KG", price: 950, old_price: 1100, rating: 4.8, reviews: 320, discount: 13, emoji: "🌶️", stock: true, category: "Spices", wholesale_price: 820, wholesale_min_qty: 10 },
        { name: "Turmeric (Haldi Powder)", brand: "National", weight: "1 KG", price: 680, old_price: 800, rating: 4.7, reviews: 215, discount: 15, emoji: "🧂", stock: true, category: "Spices", wholesale_price: 580, wholesale_min_qty: 10 },
        { name: "Black Pepper (Kali Mirch)", brand: "Shan", weight: "1 KG", price: 1850, old_price: 2100, rating: 4.9, reviews: 410, discount: 11, emoji: "🫘", stock: true, category: "Spices", wholesale_price: 1600, wholesale_min_qty: 5 },
        { name: "Cumin Seeds (Sufaid Zeera)", brand: "National", weight: "1 KG", price: 1450, old_price: 1700, rating: 4.8, reviews: 512, discount: 14, emoji: "🌾", stock: true, category: "Spices", wholesale_price: 1250, wholesale_min_qty: 5 },
        { name: "Green Cardamom (Elaichi)", brand: "Shan", weight: "1 KG", price: 4200, old_price: 4900, rating: 4.9, reviews: 68, discount: 14, emoji: "🟢", stock: true, category: "Spices", wholesale_price: 3600, wholesale_min_qty: 2 },
        { name: "Coriander Seeds (Khushk Dhania)", brand: "National", weight: "1 KG", price: 550, old_price: 650, rating: 4.5, reviews: 144, discount: 15, emoji: "🥜", stock: true, category: "Spices", wholesale_price: 460, wholesale_min_qty: 10 },
        { name: "Cloves (Sabut Laung)", brand: "Shan", weight: "1 KG", price: 2400, old_price: 2800, rating: 4.8, reviews: 92, discount: 14, emoji: "🧆", stock: true, category: "Spices", wholesale_price: 2100, wholesale_min_qty: 3 },
        { name: "Cinnamon (Darchini)", brand: "National", weight: "1 KG", price: 1100, old_price: 1300, rating: 4.6, reviews: 105, discount: 15, emoji: "🥖", stock: true, category: "Spices", wholesale_price: 950, wholesale_min_qty: 5 },
        { name: "Fennel Seeds (Saunf)", brand: "National", weight: "1 KG", price: 650, old_price: 750, rating: 4.5, reviews: 88, discount: 13, emoji: "🌿", stock: true, category: "Spices", wholesale_price: 540, wholesale_min_qty: 10 },
        { name: "Black Seeds (Kalonji)", brand: "Shan", weight: "1 KG", price: 900, old_price: 1050, rating: 4.7, reviews: 62, discount: 14, emoji: "⚫", stock: true, category: "Spices", wholesale_price: 760, wholesale_min_qty: 10 },
      ];

      for (const prod of productsSeed) {
        const catId = catMap.get(prod.category);
        if (catId) {
          await sql`
            INSERT INTO products (
              name, brand, weight, price, old_price, rating, reviews, discount, emoji, stock, category_id, wholesale_price, wholesale_min_qty
            ) VALUES (
              ${prod.name}, ${prod.brand}, ${prod.weight}, ${prod.price}, ${prod.old_price || null}, ${prod.rating}, ${prod.reviews}, ${prod.discount}, ${prod.emoji}, ${prod.stock}, ${catId}, ${prod.wholesale_price || null}, ${prod.wholesale_min_qty || 1}
            )
          `;
        }
      }
    }

    const couponCount = await sql`SELECT count(*) FROM coupons`;
    if (parseInt(couponCount[0].count) === 0) {
      console.log("Seeding coupons...");
      await sql`INSERT INTO coupons (code, discount_percent) VALUES ('WELCOME10', 10), ('EIDGIFT', 15), ('HARAABAZAAR5', 5)`;
    }

    console.log("Database initialized & seeded successfully.");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}
