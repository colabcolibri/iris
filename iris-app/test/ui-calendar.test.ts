import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const PUBLIC = "public";

test("index.html includes calendar view scaffold", () => {
  const html = readFileSync(`${PUBLIC}/index.html`, "utf8");
  assert.match(html, /id="calendar-view"/);
  assert.match(html, /id="calendar-grid"/);
  assert.match(html, /id="cal-prev"/);
  assert.match(html, /id="cal-next"/);
  assert.match(html, /data-view="calendar"/);
});

test("calendar modules and styles exist", () => {
  const calendarJs = readFileSync(`${PUBLIC}/calendar-view.js`, "utf8");
  assert.match(calendarJs, /createCalendarView/);
  assert.match(calendarJs, /onMonthChange/);

  const dateUtils = readFileSync(`${PUBLIC}/date-utils.js`, "utf8");
  assert.match(dateUtils, /monthRange/);
  assert.match(dateUtils, /postDisplayDate/);

  const api = readFileSync(`${PUBLIC}/api-client.js`, "utf8");
  assert.match(api, /fetchPosts\(params/);
  assert.match(api, /from/);
  assert.match(api, /to/);

  const css = readFileSync(`${PUBLIC}/style.css`, "utf8");
  assert.match(css, /\.calendar-grid/);
  assert.match(css, /\.cal-chip/);
});

test("app.js wires calendar as default view", () => {
  const app = readFileSync(`${PUBLIC}/app.js`, "utf8");
  assert.match(app, /createCalendarView/);
  assert.match(app, /monthRange/);
  assert.match(app, /subscribeRealtimeEvents/);
});
