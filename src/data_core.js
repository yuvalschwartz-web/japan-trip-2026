const DATA = { items: [] };
/* city: where the night is spent. from: where the day starts, when it is a travel day;
   switchAt: the stop after which the day's line takes the new region's color. */
DATA.days = [
  { date: "2026-10-21", city: "tokyo", title: "שיבויה" },
  { date: "2026-10-22", city: "tokyo", title: "הארג'וקו" },
  { date: "2026-10-23", city: "tokyo", title: "אסקוסה ואקיהברה" },
  { date: "2026-10-24", city: "tokyo", title: "שינג'וקו" },
  { date: "2026-10-25", city: "kyoto", from: "tokyo", switchAt: "d1025-train", title: "מגיעים לקיוטו, מרכז העיר וגיון" },
  { date: "2026-10-26", city: "kyoto", title: "פושימי אינארי והיגשיאמה" },
  { date: "2026-10-27", city: "kyoto", title: "ארשיאמה וביתן הזהב" },
  { date: "2026-10-28", city: "kanazawa", from: "kyoto", switchAt: "d1028-train", title: "מקיוטו לקנזאווה", sheet: "Kyoto-Kanazawa" },
  { date: "2026-10-29", city: "kanazawa", title: "קנזאווה: הגן, השוק והסמוראים", sheet: "Kanazawa sites (Kenrokuen garden, Omicho fish market, Nagamachi samurai district)" },
  { date: "2026-10-30", city: "takayama", from: "kanazawa", switchAt: "d1030-bus", title: "שיראקאווה-גו וטקאיאמה", sheet: "Kanazawa-shirkawa go-takayama" },
  { date: "2026-10-31", city: "onsen", from: "takayama", switchAt: "d1031-bus", title: "טקאיאמה, ובערב אונסן", sheet: "Takayama-onsen" },
  { date: "2026-11-01", city: "matsumoto", from: "onsen", switchAt: "d1101-bus", title: "קמיקוצ'י ומצומוטו", sheet: "Onsen- Kamikochi - Matsumoto" },
  { date: "2026-11-02", city: "matsumoto", title: "עמק קיסו: ממגומה לצומגו", sheet: "Matsumoto - Kiso valley - Matsumoto" },
  { date: "2026-11-03", city: "tokyo", from: "matsumoto", switchAt: "d1103-azusa", title: "חוזרים לטוקיו: גינזה" },
  { date: "2026-11-04", city: "tokyo", title: "צוקיג'י וגינזה" },
  { date: "2026-11-05", city: "tokyo", title: "חזרה הביתה" },
];
DATA.regions = {
  tokyo: { label: "טוקיו" }, kyoto: { label: "קיוטו" }, kanazawa: { label: "קנזאווה" },
  takayama: { label: "טקאיאמה" }, onsen: { label: "Okuhida" }, matsumoto: { label: "מצומוטו" },
};
// the calendar: one row per part of the trip
DATA.rows = [
  { label: `<span class="c-tokyo">טוקיו</span> ו<span class="c-kyoto">קיוטו</span>`, sub: `4 לילות בשיבויה, 3 בקיוטו`, from: 0, to: 7 },
  { label: `<span class="c-kanazawa">קנזאווה</span> ו<span class="c-takayama">האלפים</span>`, sub: `<span class="c-kanazawa">קנזאווה</span>, <span class="c-takayama">טקאיאמה</span>, <span class="c-onsen">Okuhida</span>, <span class="c-matsumoto">מצומוטו</span>`, from: 7, to: 13 },
  { label: `<span class="c-tokyo">טוקיו, גינזה</span>`, sub: `2 לילות, וב-<bdi>5.11</bdi> טסים הביתה`, from: 13, to: 16 },
];
DATA.tags = {
  temple: { label: "מקדש", icon: "torii" },
  museum: { label: "מוזיאון", icon: "museum" },
  shop: { label: "קניות", icon: "bag" },
  food: { label: "אוכל", icon: "food" },
  bar: { label: "בר", icon: "glass" },
  onsen: { label: "אונסן", icon: "steam" },
  rest: { label: "מנוחה", icon: "rest" },
  view: { label: "אתר ונוף", icon: "eye" },
  nature: { label: "טבע ופארק", icon: "tree" },
  move: { label: "נסיעה", icon: "walk" },
  red: { label: "אדום בגיליון", icon: "flag" },
  check: { label: "לברר אם שווה", icon: "alert" },
  ticket: { label: "יש כרטיס", icon: "ticket" },
  book: { label: "להזמין", icon: "clock" },
};
// rough clock times for the plan's "morning / noon / evening" labels, used only to keep items in order
DATA.whenKey = { "בוקר": "08:00", "צהריים": "12:30", "אחה״צ": "15:00", "שקיעה": "17:30", "ערב": "19:00", "לילה": "22:00" };
// one day's stops, in the order they happen; sug: an addition that is not in the sheet
const day = (date, arr) => arr.forEach((x, i) => DATA.items.push({ list: "day:" + date, order: i, ...x }));
