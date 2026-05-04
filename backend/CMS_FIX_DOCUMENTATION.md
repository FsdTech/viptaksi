# VipStar CMS Database - Complete Fix Documentation

## ✅ PROBLEM FIXED

**Original Error:**
```
error: column "type" of relation "website_cms" does not exist
```

**Root Cause:**
- The `website_cms` table was created with an old schema that didn't have the `type` column
- Code was trying to INSERT into a `type` column that didn't exist
- SQL syntax errors from improper JSONB handling

---

## 📋 SOLUTION SUMMARY

### 1. Database Schema (FIXED)

**Table: `website_cms`**
```sql
CREATE TABLE website_cms (
  id SERIAL PRIMARY KEY,
  section VARCHAR(100) NOT NULL,
  "key" VARCHAR(100) NOT NULL,
  value JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(section, "key")
);
```

**Key Points:**
- ✅ `key` is quoted as `"key"` (PostgreSQL reserved word)
- ✅ `value` is JSONB type (not TEXT)
- ✅ No `type` column (removed to fix error)
- ✅ UNIQUE constraint on (section, "key")

---

### 2. Safe INSERT Method (FIXED)

**WRONG (caused errors):**
```sql
INSERT INTO website_cms (section, key, value, type) 
VALUES ('hero', 'title', 'Some text', 'text');
```

**CORRECT (working):**
```sql
INSERT INTO website_cms (section, "key", value) 
VALUES ('hero', 'title', '"Codecanyon Seviyesinde Premium VipStar Landing"'::jsonb);
```

**Rules:**
- ✅ Separate INSERT statements (no multi-row)
- ✅ All values cast to `::jsonb`
- ✅ Strings wrapped as JSON: `'"text"'`
- ✅ Objects/arrays as proper JSON: `'[{}]'`
- ✅ `"key"` always quoted

---

### 3. Demo Data Inserted

All sections successfully inserted:
- ✅ **hero** - title, subtitle, app_store_url, play_store_url
- ✅ **stats** - happy_clients, active_riders, verified_drivers, cancel_ratio
- ✅ **how_it_works** - title, subtitle, items (array)
- ✅ **features** - title, items (array)
- ✅ **why_us** - title, items (array)
- ✅ **testimonials** - title, items (array)
- ✅ **faq** - title, items (array)
- ✅ **cta** - title, subtitle
- ✅ **contact** - title, subtitle, address, email, phone
- ✅ **footer** - copyright, brand, tagline

---

### 4. API Endpoint (WORKING)

**GET /api/website**

Returns grouped JSON data:
```json
{
  "hero": {
    "title": "Codecanyon Seviyesinde Premium VipStar Landing",
    "subtitle": "Bu demo, satış sayfası kalitesinde...",
    "app_store_url": "https://apps.apple.com",
    "play_store_url": "https://play.google.com"
  },
  "stats": {
    "happy_clients": "10000+",
    "active_riders": "2000+",
    "verified_drivers": "500+",
    "cancel_ratio": "1.5%"
  },
  "how_it_works": {
    "title": "3 Kolay Adımda Yolculuğunu Başlat",
    "subtitle": "Mobil uygulama mantığını...",
    "items": [
      {
        "icon": "pin-map",
        "title": "Konumunu Belirle",
        "desc": "Alınacağın ve bırakılacağın..."
      }
    ]
  }
}
```

---

### 5. Controller Updates (FIXED)

**Key Changes:**

1. **SELECT queries** - `"key"` quoted properly:
```javascript
const cmsResult = await pool.query(
  'SELECT section, "key", value FROM website_cms ORDER BY section, "key"'
);
```

2. **JSONB auto-parsing** - No manual JSON.parse needed:
```javascript
// value is already JSONB, so it's parsed automatically by pg
content[row.section][row.key] = row.value;
```

3. **INSERT with JSONB cast**:
```javascript
await pool.query(
  `INSERT INTO website_cms (section, "key", value) 
   VALUES ($1, $2, $3::jsonb)`,
  [section, key, JSON.stringify(value)]
);
```

4. **Safe JSON handling**:
```javascript
let jsonValue;
if (typeof value === 'string') {
  try {
    jsonValue = JSON.parse(value);
  } catch (e) {
    jsonValue = value;
  }
} else {
  jsonValue = value;
}
```

---

## 📁 Files Modified

1. **backend/src/db.js**
   - Dropped and recreated `website_cms` table with correct schema
   - Changed `value` from TEXT to JSONB
   - Removed `type` column
   - Updated all INSERT statements to use separate queries with `::jsonb` cast
   - Quoted `"key"` column everywhere

2. **backend/src/controllers/websiteCMS.controller.js**
   - Fixed all SELECT queries to quote `"key"`
   - Removed manual JSON.parse (JSONB auto-parses)
   - Updated INSERT/UPDATE to use `::jsonb` cast
   - Added safe JSON handling in updateCMSContent

3. **backend/sql/website_cms_setup.sql** (NEW)
   - Complete SQL file for manual database setup
   - All INSERT statements with proper JSONB casting
   - Can be run in DBeaver or psql

---

## 🚀 Testing

### Server Status
✅ Server starts without errors
✅ Database initialization successful
✅ CMS data inserted correctly
✅ API endpoint returns proper JSON

### API Test
```bash
# Test the public endpoint
curl http://localhost:5000/api/website

# Test admin endpoint (requires auth)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/website/admin
```

### Database Verification
```sql
-- Check table structure
\d website_cms

-- View all data
SELECT section, "key", value FROM website_cms ORDER BY section, "key";

-- Count rows
SELECT COUNT(*) FROM website_cms;
```

---

## 🔧 Admin Endpoints

All admin endpoints working:

1. **GET /api/website/admin** - Get all CMS content (admin only)
2. **PUT /api/website/admin/cms** - Update single CMS entry
3. **PUT /api/website/admin/section/:section** - Update entire section
4. **POST /api/website/admin/media** - Add media
5. **DELETE /api/website/admin/media/:id** - Delete media

---

## 🎯 Landing Page Integration

The landing page at `/apps/website/src/pages/Landing.tsx` can now:

1. Fetch CMS data from `GET /api/website`
2. Receive properly structured JSON
3. Display dynamic content from database
4. No parsing errors (JSONB handles it)

**Example usage:**
```typescript
const response = await fetch('/api/website');
const content = await response.json();

// Access sections
console.log(content.hero.title);
console.log(content.stats.happy_clients);
console.log(content.how_it_works.items);
```

---

## ⚠️ Important Notes

1. **Never use multi-row INSERT** with JSONB in this system
2. **Always quote "key"** column in SQL queries
3. **JSONB auto-parses** in node-postgres (no JSON.parse needed)
4. **Use `::jsonb` cast** when inserting values
5. **String values** must be wrapped as JSON strings: `'"text"'`
6. **Objects/arrays** are already JSON format

---

## 🎉 Result

✅ No more SQL syntax errors
✅ No more "column does not exist" errors
✅ DBeaver shows data correctly
✅ Landing page receives proper JSON
✅ Admin panel can update content
✅ All endpoints working
✅ Server starts cleanly

**The CMS system is now fully operational!**
