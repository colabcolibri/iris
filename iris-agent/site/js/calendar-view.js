import {
  WEEKDAYS,
  addMonths,
  calendarCells,
  formatMonthLabel,
  postDisplayDate,
  sameDay,
  truncate,
} from "./date-utils.js";

function formatChipTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function createCalendarView(root, { onSelect }) {
  const headingEl = root.querySelector("#calendar-heading");
  const gridEl = root.querySelector("#calendar-grid");
  const prevBtn = root.querySelector("#cal-prev");
  const nextBtn = root.querySelector("#cal-next");

  let cursor = new Date();
  let posts = [];
  let selectedId = null;

  function render() {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    headingEl.textContent = formatMonthLabel(year, month);

    const cells = calendarCells(year, month);
    const today = new Date();

    gridEl.replaceChildren();

    for (const label of WEEKDAYS) {
      const weekday = document.createElement("div");
      weekday.className = "cal-weekday";
      weekday.textContent = label;
      gridEl.appendChild(weekday);
    }

    for (const day of cells) {
      const cell = document.createElement("div");
      cell.className = "cal-day";
      cell.setAttribute("role", "gridcell");

      if (day.getMonth() !== month) {
        cell.classList.add("is-outside");
      }
      if (sameDay(day, today)) {
        cell.classList.add("is-today");
      }

      const number = document.createElement("div");
      number.className = "cal-day-number";
      number.textContent = String(day.getDate());
      cell.appendChild(number);

      const dayPosts = posts.filter((post) => {
        const raw = postDisplayDate(post);
        if (!raw) return false;
        return sameDay(new Date(raw), day);
      });

      for (const post of dayPosts.slice(0, 3)) {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "cal-chip";
        chip.dataset.status = post.status;
        chip.dataset.postId = post.id;
        if (selectedId === post.id) {
          chip.classList.add("is-selected");
        }

        const time = post.scheduled_at ? formatChipTime(post.scheduled_at) : "";
        const label = time ? `${time} · ${truncate(post.caption, 24)}` : truncate(post.caption, 28);
        chip.textContent = label;
        chip.addEventListener("click", () => onSelect(post));
        cell.appendChild(chip);
      }

      if (dayPosts.length > 3) {
        const more = document.createElement("span");
        more.className = "cal-more";
        more.textContent = `+${dayPosts.length - 3} mais`;
        cell.appendChild(more);
      }

      gridEl.appendChild(cell);
    }
  }

  prevBtn.addEventListener("click", () => {
    cursor = addMonths(cursor, -1);
    render();
  });

  nextBtn.addEventListener("click", () => {
    cursor = addMonths(cursor, 1);
    render();
  });

  return {
    setPosts(nextPosts) {
      posts = nextPosts;
      render();
    },
    setSelected(id) {
      selectedId = id;
      for (const chip of gridEl.querySelectorAll(".cal-chip")) {
        chip.classList.toggle("is-selected", chip.dataset.postId === id);
      }
    },
  };
}
