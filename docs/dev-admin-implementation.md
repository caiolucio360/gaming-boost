# Dev-Admin Commission System Implementation

Implement a "Dev-Admin" user that receives a percentage of the order total **before** the remaining amount is split between boosters and admins.

## User Clarifications (Verified)

1. **Math Logic:** Confirmed. Dev-Admin takes cut first, then remaining is split 70/30.
   - Example: R$100 Order → Dev-Admin R$10 → Remaining R$90 → Booster R$63, Admins R$27.
2. **Total Stats:** Dev-Admin is EXCLUDED from public total user counts (for other admins).
3. **Self-Visibility:** Dev-Admin **CAN** see their own stats and count themselves.
4. **Functionality:** Dev-Admin works as a normal admin (chats, disputes, etc).
5. **Earnings Visibility:** Dev-Admin **CAN** see their earnings in UI/API.

---

## Proposed Changes

### Database Layer (Prisma Schema)

#### [MODIFY] [schema.prisma](file:///c:/Users/caiol/source/repos/boosT/gaming-boost/prisma/schema.prisma)

**User Model** - Add `isDevAdmin` flag:
```prisma
model User {
  // ... existing fields
  isDevAdmin         Boolean  @default(false)  // Only ONE user should have this true
}
```

**CommissionConfig Model** - Add `devAdminPercentage`:
```prisma
model CommissionConfig {
  // ... existing fields
  devAdminPercentage Float?   // null = no dev-admin cut, e.g. 0.10 = 10%
}
```

---

### New Model: DevAdminRevenue

#### [NEW] DevAdminRevenue in [schema.prisma](file:///c:/Users/caiol/source/repos/boosT/gaming-boost/prisma/schema.prisma)

```prisma
model DevAdminRevenue {
  id         Int           @id @default(autoincrement())
  orderId    Int           @unique
  devAdminId Int
  orderTotal Float
  percentage Float
  amount     Float
  status     RevenueStatus @default(PENDING)
  paidAt     DateTime?
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt
  order      Order         @relation(fields: [orderId], references: [id], onDelete: Cascade)
  devAdmin   User          @relation("DevAdminRevenues", fields: [devAdminId], references: [id], onDelete: Cascade)

  @@index([devAdminId, status])
  @@index([status])
}
```

Add to User model:
```prisma
devAdminRevenues   DevAdminRevenue[] @relation("DevAdminRevenues")
```

Add to Order model:
```prisma
devAdminRevenue    DevAdminRevenue?
```

---

### Service Layer

#### [MODIFY] [order.service.ts](file:///c:/Users/caiol/source/repos/boosT/gaming-boost/src/services/order.service.ts)

1. **Update `calculateCommission()`** - Implement confirmed logic (Dev first, then split rest).
2. **Update `acceptOrder()`** - Create `DevAdminRevenue`.
3. **Update `completeOrder()`** - Release `DevAdminRevenue`.

---

### API & Visibility Logic

#### [MODIFY] [route.ts (admin/stats)](file:///c:/Users/caiol/source/repos/boosT/gaming-boost/src/app/api/admin/stats/route.ts)

- **If requester is Dev-Admin:** Show total admins (including self) + Show Dev-Admin Revenue.
- **If requester is Regular Admin:** Hide Dev-Admin from count + Hide Dev-Admin Revenue (only show regular admin revenue).

```typescript
const isDevAdmin = user.isDevAdmin;

// Stats query
const adminCountBase = isDevAdmin ? {} : { isDevAdmin: false };
const totalAdmins = await prisma.user.count({ where: { role: 'ADMIN', ...adminCountBase } });
```

---

### Frontend Updates

#### [MODIFY] [page.tsx (admin)](file:///c:/Users/caiol/source/repos/boosT/gaming-boost/src/app/admin/page.tsx)

- Add new Stat Card for **"Dev Revenue"** (Visible ONLY to Dev-Admin).
- Show admin count (API handles the number).

---

## Commission Flow

```
Order Total: R$ 100.00
Dev-Admin: 10%
Booster: 70%

1. Dev-Admin cut: R$ 10.00 (10%)
2. Remaining: R$ 90.00
3. Booster: R$ 63.00 (70% of R$ 90)
4. Admins: R$ 27.00 (30% of R$ 90)
```
