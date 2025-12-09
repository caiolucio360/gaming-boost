/**
 * Central export for all Zod schemas
 * Import from here to use schemas across the application
 */

// Common schemas
export {
    IdSchema,
    PaginationSchema,
    EmailSchema,
    PhoneSchema,
    TaxIdSchema,
    MoneySchema,
    OptionalStringSchema,
} from './common'

// Auth schemas
export {
    RegisterSchema,
    LoginSchema,
    UpdateProfileSchema,
    type RegisterInput,
    type LoginInput,
    type UpdateProfileInput,
} from './auth'

// Order schemas
export {
    OrderStatusEnum,
    CreateOrderSchema,
    UpdateOrderStatusSchema,
    OrderFilterSchema,
    type OrderStatus,
    type CreateOrderInput,
    type UpdateOrderStatusInput,
    type OrderFilterInput,
} from './order'

// Payment schemas
export {
    CreatePixSchema,
    WithdrawRequestSchema,
    PaymentWebhookSchema,
    type CreatePixInput,
    type WithdrawRequestInput,
    type PaymentWebhookInput,
} from './payment'
