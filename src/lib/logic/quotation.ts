/**
 * KING PLAST | الكينج بلاست
 * Core Business Logic: Quotations, Reference Generation, and Form Validation
 */

export interface QuotationItemInput {
  productId: string;
  productName: string;
  polymerType: string;
  quantity: number;
  unit: 'ton' | 'kg';
  customColor?: string;
  customSpecs?: string;
  packagingPreference?: string;
}

export interface QuotationPayload {
  customerName: string;
  companyName?: string;
  phone: string;
  email?: string;
  governorate: string;
  notes?: string;
  items: QuotationItemInput[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Generates a unique wholesale quotation reference number
 * Example: KP-2026-4821
 */
export function generateQuotationReference(sequenceSeed?: number, year: number = 2026): string {
  const code = sequenceSeed !== undefined 
    ? String(Math.abs(sequenceSeed) % 10000).padStart(4, '0')
    : String(Math.floor(1000 + Math.random() * 9000));
  return `KP-${year}-${code}`;
}

/**
 * Validates a quotation submission according to industrial wholesale rules
 */
export function validateQuotationRequest(payload: Partial<QuotationPayload>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!payload.customerName || payload.customerName.trim().length < 2) {
    errors.customerName = 'يرجى إدخال اسم العميل أو المسؤول (حرفان على الأقل)';
  }

  if (!payload.phone || !/^[0-9+()\- ]{8,25}$/.test(payload.phone.trim())) {
    errors.phone = 'يرجى إدخال رقم هاتف أو جوال صالح للمتابعة الصناعية';
  }

  if (!payload.governorate || payload.governorate.trim().length === 0) {
    errors.governorate = 'يرجى اختيار المحافظة أو الوجهة الصناعية للتوريد';
  }

  if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
    errors.items = 'يجب إضافة خامة واحدة على الأقل إلى سلة عرض السعر';
  } else {
    payload.items.forEach((item, index) => {
      if (!item.quantity || Number(item.quantity) <= 0) {
        errors[`item_${index}_quantity`] = `يرجى تحديد كمية صالحة للخامة ${item.productName || index + 1}`;
      }
      if (!item.unit || (item.unit !== 'ton' && item.unit !== 'kg')) {
        errors[`item_${index}_unit`] = 'وحدة القياس يجب أن تكون بالطن أو الكيلوجرام';
      }
    });
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Prepares pre-filled Arabic WhatsApp message link for a quotation
 */
export function buildWhatsAppQuotationUrl(
  whatsappNumber: string,
  quotation: {
    referenceNumber: string;
    customerName: string;
    itemsSummary?: string;
  }
): string {
  const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
  const message = `مرحباً مصنع الكينج بلاست | KING PLAST،
أود الاستفسار ومتابعة طلب عرض السعر رقم: *${quotation.referenceNumber}*
باسم: *${quotation.customerName}*
${quotation.itemsSummary ? `تفاصيل الخامات: ${quotation.itemsSummary}` : ''}
شكراً لكم.`;

  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}
