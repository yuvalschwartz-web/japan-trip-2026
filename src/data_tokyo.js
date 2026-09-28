DATA.days[1].brief = "<b>הערה שלכם:</b> לוקח למזוודות יומיים להגיע.";
DATA.days[2].brief = "<b>הערה שלכם:</b> להזמין מראש נסיעות בין ערים. הכל מרוכז בלשונית \"הזמנות\".";

/* 21.10 Wed */
day("2026-10-21", [
  { id: "d1021-land", time: "13:20", kind: "fixed", title: "נוחתים ביפן", tags: ["move"], desc: "הגעה למלון ב-15:30.", book: "bk-flight-out" },
  { id: "d1021-hotel", time: "15:30", title: "All Day Place Shibuya", tags: ["rest"], book: "bk-hotel-shibuya", map: "All Day Place Shibuya" },
  { id: "d1021-crossing", title: "Shibuya Crossing", tags: ["view"], desc: "יש תצפית על הכביש מהסניף של סטארבקס.", map: "Shibuya Scramble Crossing" },
  { id: "d1021-hachiko", title: "פסל Hachiko ו-Hoshino Coffee", tags: ["view", "food"], desc: "באותו אזור בית הקפה <b>Hoshino Coffee</b>, ולטעום את הסופלה פנקייק המפורסם.", map: "Hachiko Statue, Shibuya" },
  { id: "d1021-parco", title: "Shibuya Parco", tags: ["shop"], desc: "קומה 6 היא קומת האנימה, והגג פתוח עם צמחייה.", map: "Shibuya PARCO" },
  { id: "d1021-centergai", title: "רחוב Center Gai", tags: ["shop", "food"], desc: "אורות, מסעדות וחנויות. יש דון קיחוטה ופמילי מארט באזור.", map: "Center Gai, Shibuya" },
  { id: "d1021-sky", when: "ערב", title: "Shibuya Sky", tags: ["view", "red"], desc: "תצפית, ולבקר בקניון שמתחת, <b>Shibuya Scramble Square</b>.", book: "tb-shibuyasky", map: "SHIBUYA SKY" },
  { id: "d1021-night", title: "שוב ב-Shibuya Crossing, בחושך", tags: ["view"], desc: "אפשר לעבור שוב ולראות את האזור בלילה." },
  { id: "d1021-sg", when: "לילה", title: "בר The SG Club", tags: ["bar", "red"], desc: "לסיים את היום כאן, תשע דקות מהמלון.", map: "The SG Club, Shibuya" },
]);

/* 22.10 Thu */
day("2026-10-22", [
  { id: "d1022-meiji", title: "מקדש Meiji", tags: ["temple"], desc: "טיול במקדש.", map: "Meiji Jingu" },
  { id: "d1022-yoyogi", title: "פארק Yoyogi", tags: ["nature"], desc: "להסתובב בפארק הצמוד למקדש.", map: "Yoyogi Park" },
  { id: "d1022-takeshita", title: "רחוב Takeshita", tags: ["food", "shop"], desc: "רחוב אוכל צבעוני, טוסט קשת בענן.", map: "Takeshita Street" },
  { id: "d1022-omotesando", title: "Omotesando", tags: ["shop"], desc: "רחוב יוקרתי. נעליים: <b>ABC-Mart</b>, ונעליים לרומי ב-<b>Onitsuka Tiger</b>.", map: "Omotesando" },
  { id: "d1022-lunch", title: "המלצה: סושי, אודון או לובסטר", tags: ["food"], desc: "סושי מסוע עם כוכב מישלן ב-<b>Kaiten Sushi Ginza</b>, אודון קרבונרה ב-<b>Menchirashi</b>, ואפשר גם <b>Luke's Lobster</b>. הפרטים בלשונית \"אוכל\"." },
  { id: "d1022-cat", title: "Cat Street", tags: ["shop"], desc: "רחוב של חנויות בוטיק ויד שנייה מקומיות.", map: "Cat Street, Harajuku" },
  { id: "d1022-miyashita", title: "Miyashita Park", tags: ["shop", "nature"], desc: "קניון קרוב למלון, חנויות בגדים ומותגים, ובגג יש פארק חמוד.", map: "MIYASHITA PARK, Shibuya" },
]);

/* 23.10 Fri */
day("2026-10-23", [
  { id: "d1023-kappabashi", title: "Kappabashi Dori", tags: ["shop"], desc: "מתחילים כאן. Kappabashi Hondōri Shopping Street, רחוב קניות לכלי מטבח.", map: "Kappabashi Dougu Street" },
  { id: "d1023-nakamise", title: "Nakamise Shopping Street", tags: ["food", "shop"], desc: "חטיפים ואוכל יפני, מזכרות וכו'. הרחוב מוביל ישר למקדש.", map: "Nakamise Shopping Street" },
  { id: "d1023-sensoji", title: "מקדש Senso-ji", tags: ["temple"], map: "Senso-ji" },
  { id: "d1023-teamlab", title: "teamLab Planets", tags: ["museum", "red"], desc: "רכבת ישירה, או שיט ממפרץ אסאקוסה לכיוון אודאיבה, ומשם רכבת <b>Yurikamome</b>.", book: "tb-teamlab", map: "teamLab Planets TOKYO" },
  { id: "d1023-akiba", when: "ערב", title: "אקיהברה", tags: ["shop"], desc: "רוב החנויות נסגרות ב-20:00. ללכת באזור החנות <b>Yodobashi Akiba</b> והארקייד <b>TAITO Station Akihabara</b>.", map: "Yodobashi Camera Multimedia Akiba" },
  { id: "d1023-dinner", title: "ארוחת ערב: לזרום", tags: ["food"], desc: "באקיהברה, או לחזור לשיבויה." },
  { id: "d1023-pokemon", title: "Pokémon Center Shibuya", tags: ["shop"], desc: "להביא לרומי בובה קטנה :)", map: "Pokemon Center Shibuya" },
  { id: "d1023-bellwood", when: "לילה", title: "בר The Bellwood", tags: ["bar", "red"], desc: "בר מאוד שווה, מקום 48 בעולם.", map: "The Bellwood, Shibuya" },
]);

/* 24.10 Sat */
day("2026-10-24", [
  { id: "d1024-gyoen", title: "Shinjuku Gyoen", tags: ["nature"], desc: "לטייל בגנים היפניים.", map: "Shinjuku Gyoen National Garden" },
  { id: "d1024-isetan", title: "Isetan Shinjuku", tags: ["food", "shop"], desc: "אופציה לארוחת בוקר: כלבו אוכל ענק, ודון קיחוטה ויוניקלו באזור. בכלבו יש חנות שוקולד בעבודת יד, <b>Jean-Paul Hévin</b>.", map: "Isetan Shinjuku" },
  { id: "d1024-cat", title: "החתול התלת-ממדי הענק", tags: ["view"], desc: "להמשיך לאזור המרכזי ולראות את החתול המפורסם (the giant 3D cat).", map: "Cross Shinjuku Vision" },
  { id: "d1024-godzilla", title: "ראש גודזילה", tags: ["view"], desc: "פסל גודזילה (Godzilla Head).", map: "Godzilla Head, Shinjuku" },
  { id: "d1024-kabukicho", title: "Kabukicho", tags: ["view"], desc: "רובע האורות האדומים המפורסם.", map: "Kabukicho" },
  { id: "d1024-bambi", title: "Bam Bi Coffee", tags: ["food"], desc: "אופציה לקפה ולפנקייק יפני אוורירי.", map: "bam bi coffee, Shinjuku" },
  { id: "d1024-sushi", title: "צהריים: סושי מסוע", tags: ["food"], desc: "אופציה: <b>odeo shinjukuminami guchiten</b>." },
  { id: "d1024-tmg", title: "Tokyo Metropolitan Government Building", tags: ["view"], desc: "תצפית חינמית יפה.", map: "Tokyo Metropolitan Government Building" },
  { id: "d1024-central", title: "Shinjuku Central Park", tags: ["nature"], desc: "לטייל בפארק, וחזרה למלון.", map: "Shinjuku Central Park" },
  { id: "d1024-omoide", when: "ערב", title: "Omoide Yokocho", tags: ["bar", "food"], desc: "רחוב הברים.", map: "Omoide Yokocho" },
  { id: "d1024-pack", sug: 1, when: "לילה", title: "לארוז לקיוטו", tags: ["rest"], desc: "אם רוצים לנסוע בשינקנסן בלי מזוודות גדולות, האפשרויות בלשונית \"ציוד ומידע\", תחת מזוודות." },
]);
