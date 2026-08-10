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

test("buildMetaAuthorizeUrl uses Instagram OAuth and business scopes", () => {
  const url = buildMetaAuthorizeUrl(config, "signed-state");
  assert.match(url, /instagram\.com\/oauth\/authorize/);
  assert.match(url, /client_id=app-123/);
  assert.match(url, /state=signed-state/);
  assert.match(url, /instagram_business_basic/);
  assert.match(url, /instagram_business_manage_insights/);
  assert.match(url, /instagram_business_manage_messages/);
  assert.doesNotMatch(url, /pages_show_list/);
});

test("completeFromCode stores Instagram user token and profile", async () => {
  const fetchImpl = async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input.toString());

    if (url.hostname === "api.instagram.com" && url.pathname === "/oauth/access_token") {
      return new Response(
        JSON.stringify({
          data: [{ access_token: "short-user", user_id: "ig-99" }],
        }),
        { status: 200 },
      );
    }

    if (url.hostname === "graph.instagram.com" && url.pathname === "/access_token") {
      return new Response(
        JSON.stringify({ access_token: "long-user", expires_in: 3600 }),
        { status: 200 },
      );
    }

    if (url.hostname === "graph.instagram.com" && url.pathname.endsWith("/me")) {
      return new Response(
        JSON.stringify({ user_id: "ig-99", username: "brand" }),
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
    assert.equal(result.accessToken, "long-user");
    assert.equal(result.account.igUserId, "ig-99");
    assert.equal(result.account.igUsername, "brand");
  }
});
