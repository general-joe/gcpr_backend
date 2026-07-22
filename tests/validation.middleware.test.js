import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";

import { safeValidate, validate, validateData } from "../src/middlewares/validation.js";

const createResponse = () => {
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

  return response;
};

test("validate middleware stores parsed body data and calls next", async () => {
  const schema = z.object({
    name: z.string().trim().min(2),
    age: z.coerce.number().int().min(0),
  });
  const request = { body: { name: " Ama ", age: "7" } };
  const response = createResponse();
  let nextCalled = false;

  await validate(schema)(request, response, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(request.validatedData, { name: "Ama", age: 7 });
  assert.equal(response.statusCode, null);
});

test("validate middleware returns normalized Zod validation errors", async () => {
  const schema = z.object({ email: z.email() });
  const request = { body: { email: "not-an-email" } };
  const response = createResponse();

  await validate(schema)(request, response, () => {
    throw new Error("next should not be called");
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, "Validation failed");
  assert.deepEqual(response.body.errors[0].field, "email");
});

test("validate middleware merges parsed query and params data", async () => {
  const schema = z.object({ limit: z.coerce.number().int().min(1).max(100) });
  const request = { query: { limit: "25", keep: "raw" } };
  const response = createResponse();

  await validate(schema, "query")(request, response, () => {});

  assert.deepEqual(request.query, { limit: 25, keep: "raw" });
});

test("validateData returns parsed data or throws formatted errors", async () => {
  const schema = z.object({ count: z.coerce.number().int() });

  await assert.deepEqual(await validateData(schema, { count: "3" }), { count: 3 });
  await assert.rejects(
    () => validateData(schema, { count: "abc" }),
    /"field":"count"/,
  );
});

test("safeValidate returns success and failure result objects", async () => {
  const schema = z.object({ id: z.uuid() });

  assert.deepEqual(await safeValidate(schema, { id: "550e8400-e29b-41d4-a716-446655440000" }), {
    success: true,
    data: { id: "550e8400-e29b-41d4-a716-446655440000" },
  });

  const result = await safeValidate(schema, { id: "bad" });
  assert.equal(result.success, false);
  assert.equal(result.errors[0].field, "id");
});

test("validate throws early when called without a Zod schema", () => {
  assert.throws(() => validate(null), /expects a valid Zod schema/);
});
