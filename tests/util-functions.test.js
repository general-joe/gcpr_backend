import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

import UtilFunctions from "../src/utils/UtilFunctions.js";

test("outputSuccess removes nulls and passwords from response payloads", () => {
  const response = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  UtilFunctions.outputSuccess(response, {
    id: "user-1",
    name: "Kojo",
    password: "secret",
    optional: null,
    nested: {
      keep: true,
      remove: null,
    },
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.data, {
    id: "user-1",
    name: "Kojo",
    nested: { keep: true },
  });
});

test("normalizes stringified JSON without changing plain strings", () => {
  assert.deepEqual(UtilFunctions.normalizeJson('{"a":1}'), { a: 1 });
  assert.deepEqual(UtilFunctions.normalizeJson(['{"a":1}', "plain"]), [{ a: 1 }, "plain"]);
  assert.equal(UtilFunctions.normalizeJson("plain"), "plain");
});

test("deepNormalizeJson unwraps repeatedly stringified JSON", () => {
  const doubleEncoded = JSON.stringify(JSON.stringify({ ok: true }));

  assert.deepEqual(UtilFunctions.deepNormalizeJson(doubleEncoded), { ok: true });
});

test("generates access tokens with token version claim when supplied", () => {
  const originalJwtSecret = process.env.JWT;
  process.env.JWT = "test-secret";

  try {
    const token = UtilFunctions.generateAccessToken({
      id: "user-1",
      userType: "CAREGIVER",
      tokenVersion: 4,
    });

    const decoded = jwt.verify(token, process.env.JWT);
    assert.equal(decoded.id, "user-1");
    assert.equal(decoded.userType, "CAREGIVER");
    assert.equal(decoded.tv, 4);
    assert.equal(decoded.tokenVersion, undefined);
  } finally {
    if (originalJwtSecret === undefined) {
      delete process.env.JWT;
    } else {
      process.env.JWT = originalJwtSecret;
    }
  }
});

test("formats Ghana phone numbers for local and international inputs", () => {
  assert.equal(UtilFunctions.formatGhPhoneNumber("0244123456"), "233244123456");
  assert.equal(UtilFunctions.formatGhPhoneNumber("244123456"), "233244123456");
  assert.equal(UtilFunctions.formatGhPhoneNumber("233244123456"), "233244123456");
});
