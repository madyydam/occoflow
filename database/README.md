# Occo Flow — Database Repository & Setup Guide

Welcome to the centralized database directory for **Occo Flow** by **Heyocco**. All schemas, migrations, Prisma definitions, and documentation are maintained here.

---

## 📁 Directory Files

| File | Purpose |
|---|---|
| [**`schema.sql`**](./schema.sql) | **Master Centralized SQL File** for Supabase. Run this directly in the Supabase SQL Editor. |
| [**`schema.prisma`**](./schema.prisma) | **Prisma ORM Schema** for PostgreSQL type generation and migration workflows. |
| [**`DATABASE_DOCS.md`**](./DATABASE_DOCS.md) | **Complete Database Specifications**, Table Dictionaries, ERD Diagrams, and RLS Policies. |

---

## 🚀 Quick Setup (1 Minute)

1. Open your Supabase Dashboard:
   👉 **[Supabase Dashboard](https://supabase.com/dashboard)**
2. Go to **SQL Editor** ➔ Click **New query**.
3. Copy all contents from [`database/schema.sql`](./schema.sql), paste into the editor, and click **Run**.
4. That's it! Your Supabase database is completely provisioned with all 7 tables and initial seed data.

---

## 🛠️ Prisma ORM Usage

To push schema changes via Prisma:
```bash
# Push schema to Supabase PostgreSQL database
npx prisma db push --schema=database/schema.prisma

# Launch Prisma Studio GUI
npx prisma studio --schema=database/schema.prisma
```
