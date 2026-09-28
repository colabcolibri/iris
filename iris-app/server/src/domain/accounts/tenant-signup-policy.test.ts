import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assertTenantSignupConfig,
  signupAllows,
} from "./tenant-signup-policy.ts";

const base = {
  IRIS_ADMIN_EMAIL: "admin@example.com",
};

test("omitted signup mode lets any email open an account", () => {
  assert.equal(
    signupAllows({ email: "New@Visitor.com", hasAccount: false }, { ...base }),
    true,
  );
});

test("allowlist keeps the admin email and the extra list", () => {
  const env = {
    ...base,
    IRIS_TENANT_SIGNUP: "allowlist",
    IRIS_ALLOWED_EMAILS: "Ada@Studio.com, other@studio.com",
  };

  assert.equal(signupAllows({ email: "admin@example.com", hasAccount: false }, env), true);
  assert.equal(signupAllows({ email: "ada@studio.com", hasAccount: false }, env), true);
  assert.equal(signupAllows({ email: "stranger@studio.com", hasAccount: true }, env), false);
});

test("allowlist with only the admin email is a single tenant", () => {
  const env = { ...base, IRIS_TENANT_SIGNUP: "allowlist" };
  assert.equal(signupAllows({ email: "other@example.com", hasAccount: false }, env), false);
  assert.equal(signupAllows({ email: "admin@example.com", hasAccount: false }, env), true);
});

test("closed signup admits an existing account and blocks a new one", () => {
  const env = { ...base, IRIS_TENANT_SIGNUP: "closed" };
  assert.equal(signupAllows({ email: "member@example.com", hasAccount: true }, env), true);
  assert.equal(signupAllows({ email: "new@example.com", hasAccount: false }, env), false);
});

test("unknown signup mode fails at startup", () => {
  assert.throws(
    () => assertTenantSignupConfig({ IRIS_TENANT_SIGNUP: "everyone" }),
    /IRIS_TENANT_SIGNUP must be open, allowlist, or closed/,
  );
});
