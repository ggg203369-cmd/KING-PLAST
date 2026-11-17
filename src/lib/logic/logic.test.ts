import test from 'node:test';
import assert from 'node:assert/strict';
import { generateQuotationReference, validateQuotationRequest } from './quotation';
import { 
  hasPermission, 
  canManageTargetUser, 
  validateSuperAdminQuota, 
  executeOwnerBootstrap, 
  type UserAccount,
  type BootstrapState 
} from './rbac';

test('Quotation reference follows industrial KP-YYYY-XXXX pattern', () => {
  const ref1 = generateQuotationReference(1234, 2026);
  assert.equal(ref1, 'KP-2026-1234');

  const ref2 = generateQuotationReference(42, 2026);
  assert.equal(ref2, 'KP-2026-0042');

  const randomRef = generateQuotationReference();
  assert.match(randomRef, /^KP-2026-[0-9]{4}$/);
});

test('Validates quotation submissions strictly for industrial wholesale', () => {
  // Empty payload
  const emptyRes = validateQuotationRequest({});
  assert.equal(emptyRes.isValid, false);
  assert.ok(emptyRes.errors.customerName);
  assert.ok(emptyRes.errors.phone);
  assert.ok(emptyRes.errors.governorate);
  assert.ok(emptyRes.errors.items);

  // Valid payload
  const validRes = validateQuotationRequest({
    customerName: 'شركة النيل للصناعات البلاستيكية',
    phone: '01012345678',
    governorate: 'العاشر من رمضان',
    items: [
      {
        productId: 'prod_1',
        productName: 'حبيبات بولي بروبلين PP مخرزة معاد تدويرها',
        polymerType: 'PP',
        quantity: 5,
        unit: 'ton'
      }
    ]
  });
  assert.equal(validRes.isValid, true);
  assert.equal(Object.keys(validRes.errors).length, 0);

  // Invalid quantity
  const badQtyRes = validateQuotationRequest({
    customerName: 'مؤسسة الفجر',
    phone: '01234567890',
    governorate: 'السادات',
    items: [
      {
        productId: 'prod_1',
        productName: 'خامة PP',
        polymerType: 'PP',
        quantity: 0,
        unit: 'ton'
      }
    ]
  });
  assert.equal(badQtyRes.isValid, false);
  assert.ok(badQtyRes.errors.item_0_quantity);
});

test('RBAC enforces Owner authority and prevents demoting owner', () => {
  const owner: UserAccount = {
    id: 'owner_1',
    email: 'owner@kingplast.com',
    displayName: 'المالك الرئيسي',
    role: 'owner',
    permissions: ['manage_products', 'manage_admins'],
    status: 'active',
    isOwner: true,
    createdAt: '2026-01-01'
  };

  const superAdmin1: UserAccount = {
    id: 'admin_1',
    email: 'admin1@kingplast.com',
    displayName: 'مدير العمليات',
    role: 'super_admin',
    permissions: ['manage_products', 'manage_quotations'],
    status: 'active',
    isOwner: false,
    createdAt: '2026-01-02'
  };

  const staffUser: UserAccount = {
    id: 'staff_1',
    email: 'sales@kingplast.com',
    displayName: 'مسؤول المبيعات',
    role: 'staff',
    permissions: ['manage_quotations'],
    status: 'active',
    isOwner: false,
    createdAt: '2026-01-03'
  };

  // Owner has any permission
  assert.equal(hasPermission(owner, 'manage_admins'), true);
  assert.equal(hasPermission(owner, 'manage_settings'), true);

  // Super admin has only granted permissions
  assert.equal(hasPermission(superAdmin1, 'manage_products'), true);
  assert.equal(hasPermission(superAdmin1, 'manage_admins'), false);

  // Super admin CANNOT manage owner
  const attemptToDemoteOwner = canManageTargetUser(superAdmin1, owner);
  assert.equal(attemptToDemoteOwner.allowed, false);

  // Super admin CANNOT manage other super admins
  const superAdmin2: UserAccount = { ...superAdmin1, id: 'admin_2' };
  const attemptToManagePeer = canManageTargetUser(superAdmin1, superAdmin2);
  assert.equal(attemptToManagePeer.allowed, false);

  // Owner CAN manage super admins
  const ownerManageAdmin = canManageTargetUser(owner, superAdmin1);
  assert.equal(ownerManageAdmin.allowed, true);

  // Super admin CAN manage staff
  const adminManageStaff = canManageTargetUser(superAdmin1, staffUser);
  assert.equal(adminManageStaff.allowed, true);
});

test('Super Admin limit of 3 accounts is strictly guarded', () => {
  assert.equal(validateSuperAdminQuota(0).allowed, true);
  assert.equal(validateSuperAdminQuota(2).allowed, true);
  assert.equal(validateSuperAdminQuota(3).allowed, false);
  assert.equal(validateSuperAdminQuota(4).allowed, false);
});

test('Owner bootstrap allows exactly one initialization', () => {
  const uninitializedState: BootstrapState = {
    isInitialized: false
  };

  // First initialization succeeds
  const bootResult = executeOwnerBootstrap(uninitializedState, {
    email: 'ceo@kingplast.com',
    displayName: 'الرئيس التنفيذي'
  });

  assert.equal(bootResult.success, true);
  assert.ok(bootResult.newState);
  assert.equal(bootResult.newState?.isInitialized, true);
  assert.equal(bootResult.user?.isOwner, true);

  // Second initialization MUST fail
  const secondAttempt = executeOwnerBootstrap(bootResult.newState!, {
    email: 'hacker@attacker.com',
    displayName: 'متطفل'
  });

  assert.equal(secondAttempt.success, false);
  assert.match(secondAttempt.error!, /النظام مهيأ بالفعل/);
});
