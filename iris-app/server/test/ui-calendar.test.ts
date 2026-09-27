import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ADMIN = "../admin/src";

test("admin includes calendar view", () => {
  const calendar = readFileSync(`${ADMIN}/components/calendar/calendar-view.tsx`, "utf8");
  assert.match(calendar, /CalendarView/);
  assert.match(calendar, /calendarCells/);
  assert.match(calendar, /onCursorChange/);
});

test("admin includes calendar list view", () => {
  const list = readFileSync(
    `${ADMIN}/components/calendar/calendar-list-view.tsx`,
    "utf8",
  );
  assert.match(list, /CalendarListView/);
  assert.match(list, /groupPostsByCalendarDay/);
  assert.match(list, /kanban\.calendarList/);
  assert.match(list, /formatMonthLabel/);
});

test("calendar utilities and api filtering exist", () => {
  const dateUtils = readFileSync(`${ADMIN}/lib/date-utils.ts`, "utf8");
  assert.match(dateUtils, /postDisplayDate/);
  assert.match(dateUtils, /postCalendarDate/);
  assert.match(dateUtils, /groupPostsByCalendarDay/);

  const datetime = readFileSync(`${ADMIN}/lib/datetime.ts`, "utf8");
  assert.match(datetime, /monthRange/);
  assert.match(datetime, /calendarDayKey/);

  const api = readFileSync(`${ADMIN}/lib/api.ts`, "utf8");
  assert.match(api, /fetchPosts/);
  assert.match(api, /from/);
  assert.match(api, /calendarOnly/);
});

test("dashboard wires calendar list and realtime", () => {
  const dashboard = readFileSync(`${ADMIN}/pages/dashboard-page.tsx`, "utf8");
  assert.match(dashboard, /CalendarView/);
  assert.match(dashboard, /CalendarListView/);
  assert.match(dashboard, /monthRange/);
  assert.match(dashboard, /calendarOnly: true/);
  assert.match(dashboard, /view === "list"/);
});

test("built index serves react shell", () => {
  const html = readFileSync("../public/index.html", "utf8");
  assert.match(html, /<title>Iris<\/title>/);
  assert.match(html, /id="root"/);
  assert.match(html, /assets\/index-.*\.js/);
});
