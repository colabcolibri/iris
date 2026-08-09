import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildMetaAuthorizeUrl,
  createMetaOAuthClient,
} from "./meta-oauth-client.ts";

const config = {
  appId: "app-123",
  appSecret: "secret-456",
  redirectUri: "http://127.0.0.1:8792/auth/meta/callback",
  graphApiVersion: "v21.0",
};

test("buildMetaAuthorizeUrl includes scopes and state", () => {
  const url = buildMetaAuthorizeUrl(config, "signed-state");
  assert.match(url, /facebook\.com\/v21\.0\/dialog\/oauth/);
  assert.match(url, /client_id=app-123/);
  assert.match(url, /state=signed-state/);
  assert.match(url, /instagram_basic/);
});

test("completeFromCode stores page token and ig account", async () => {
  const fetchImpl = async (input: string | URL | Request) => {
    const url = new URL(typeof input === "string" ? input : input.toString());

    if (url.pathname.endsWith("/oauth/access_token")) {
      if (url.searchParams.get("grant_type") === "fb_exchange_token") {
        return new Response(
          JSON.stringify({ access_token: "long-user", expires_in: 3600 }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({ access_token: "short-user" }), {
        status: 200,
      });
    }

    if (url.pathname.endsWith("/me/accounts")) {
      return new Response(
        JSON.stringify({
          data: [
            {
              id: "page-1",
              name: "Brand Page",
              access_token: "page-token-abc",
              instagram_business_account: { id: "ig-99", username: "brand" },
            },
          ],
        }),
        { status: 200 },
      );
    }

    return new Response(JSON.stringify({ error: { message: "unexpected" } }), {
      status: 400,
    });
  };

  const client = createMetaOAuthClient({
    config,
    fetchImpl: fetchImpl as typeof fetch,
  });

  const result = await client.completeFromCode("oauth-code");
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.pageAccessToken, "page-token-abc");
    assert.equal(result.page.igUserId, "ig-99");
    assert.equal(result.page.igUsername, "brand");
  }
});
