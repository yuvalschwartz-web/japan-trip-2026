DATA.bookCats = [
  { id: "flight", label: "טיסות", icon: "plane" },
  { id: "train", label: "רכבות ואוטובוסים", icon: "train" },
  { id: "hotel", label: "מלונות", icon: "bed" },
  { id: "activity", label: "כרטיסים ופעילויות", icon: "ticket" },
  { id: "food", label: "מסעדות", icon: "food" },
  { id: "prep", label: "לפני הטיסה", icon: "backpack" },
  { id: "other", label: "אחר", icon: "plus" },
];
DATA.bookings = [
  { id: "bk-flight-out", cat: "flight", icon: "plane", title: "טיסה הלוך", sub: "נחיתה ביפן ביום רביעי, 21.10.2026",
    facts: [["נחיתה", "13:20"], ["הגעה למלון", "15:30"]],
    missing: "מספר הטיסה, שדה התעופה ושעת ההמראה. אפשר לרשום אותם בהערה" },
  { id: "bk-hotel-shibuya", cat: "hotel", icon: "bed", title: "All Day Place Shibuya", sub: "21.10 עד 25.10, 4 לילות", facts: [["אזור", "שיבויה"], ["לילות", "4"]], map: "All Day Place Shibuya" },
  { id: "bk-hotel-kanazawa", cat: "hotel", icon: "bed", title: "KUMU Kanazawa by THE SHARE HOTELS", sub: "28.10 עד 30.10, 2 לילות", facts: [["ליד", "Omicho Market"], ["לילות", "2"]], map: "KUMU Kanazawa by THE SHARE HOTELS" },
  { id: "bk-hotel-matsumoto", cat: "hotel", icon: "bed", title: "Onyado Nono Matsumoto Natural Hot Spring", sub: "1.11 עד 3.11, 2 לילות", facts: [["במלון", "אונסן, וראמן חינם בלילה"], ["לילות", "2"]], map: "Onyado Nono Matsumoto Natural Hot Spring" },
  { id: "bk-flight-back", cat: "flight", icon: "plane", title: "טיסה חזור", sub: "יום חמישי, 5.11.2026",
    facts: [["יציאה מהמלון", "בסביבות 12:00"]],
    missing: "מספר הטיסה ושעת ההמראה" },
];
DATA.items.push(
  { id: "tb-nohi", cat: "train", list: "tobook", title: "אוטובוס Nohi קנזאווה ← שיראקאווה-גו (30.10)", urgent: "נפתח ב-30.9", desc: "ההזמנה נפתחת בדיוק חודש מראש, והמקומות מסומנים חובה. באותה הזדמנות להזמין גם שיראקאווה-גו ← טקאיאמה.", url: "https://japanbusonline.com/en", urlLabel: "japanbusonline.com", order: 1 },
  { id: "tb-alpico", cat: "train", list: "tobook", title: "אוטובוס Alpico קמיקוצ'י ← מצומוטו (1.11)", urgent: "נפתח ב-1.10", desc: "מאז 2025 כל האוטובוסים של Alpico בקו הזה דורשים הזמנה, דרך Shin-Shimashima. ההזמנה נפתחת חודש מראש.", order: 2 },
  { id: "tb-teamlab", cat: "activity", list: "tobook", title: "teamLab Planets (23.10)", urgent: "עכשיו", desc: "כניסה בחלונות זמן, והכרטיסים נגמרים מראש.", url: "https://www.teamlab.art/e/planets/", urlLabel: "teamlab.art", order: 3 },
  { id: "tb-shibuyasky", cat: "activity", list: "tobook", title: "Shibuya Sky (21.10, בערב)", urgent: "עכשיו", desc: "כרטיסים לשעות השקיעה נגמרים מהר. אם ההזמנה עוד לא נפתחה לתאריך, לבדוק שוב בתחילת אוקטובר.", url: "https://www.shibuya-scramble-square.com/sky/", urlLabel: "shibuya-scramble-square.com", order: 4 },
  { id: "tb-hotel-kyoto", cat: "hotel", list: "tobook", title: "מלון בקיוטו (25.10 עד 28.10)", urgent: "עכשיו", desc: "האפשרויות מהגיליון:<ol class=opts><li class=pref><bdi>Kyoto Granbell Hotel</bdi><small>מודגש בגיליון</small></li><li><bdi>Aoi Hotel Kyoto</bdi></li><li><bdi>Mitsui Garden Hotel Kyoto Kawaramachi Jokyoji</bdi></li></ol>", order: 5 },
  { id: "tb-hotel-takayama", cat: "hotel", list: "tobook", title: "מלון בטקאיאמה (30.10)", urgent: "עכשיו", desc: "האפשרויות מהגיליון:<ol class=opts><li class=pref><bdi>Hida Takayama Onsen Takayama Green Hotel, KEIO GROUP HOTELS</bdi><small>מודגש בגיליון</small></li><li><bdi>hotel around TAKAYAMA, an Ascend Collection Hotel</bdi></li><li><bdi>HOTEL AMANEK HidaTakayama</bdi></li></ol>", order: 6 },
  { id: "tb-hotel-onsen", cat: "hotel", list: "tobook", title: "ריוקאן ב-Okuhida (31.10)", urgent: "עכשיו", desc: "האפשרויות מהגיליון:<ol class=opts><li class=pref><bdi>Miyama Ouan</bdi><small>מודגש בגיליון</small></li><li><bdi>Ryokan Kutsuroginoya Yuu</bdi></li></ol>כדאי לאשר גם את שעת ארוחת הערב.", order: 7 },
  { id: "tb-hotel-ginza", cat: "hotel", list: "tobook", title: "מלון בגינזה (3.11 עד 5.11)", urgent: "לפני 27.10", desc: "האפשרויות מהגיליון:<ol class=opts><li><bdi>ginza hotel by grandbell</bdi></li><li class=pref><bdi>millennium mitsui garden hotel tokyo</bdi><small>מודגש בגיליון</small></li></ol>לסגור לפני 27.10, בגלל שליחת המזוודות.", order: 8 },
  { id: "tb-shinkansen", cat: "train", list: "tobook", title: "שינקנסן שינגאווה ← קיוטו (25.10)", urgent: "עד שבוע לפני", desc: "מזוודה שסכום המידות שלה מעל 160 ס\"מ צריכה מושב עם אזור מזוודות, שמזמינים יחד עם הכרטיס.", url: "https://smart-ex.jp/en/", urlLabel: "smart-ex.jp", order: 9 },
  { id: "tb-kanazawa", cat: "train", list: "tobook", title: "רכבת קיוטו ← קנזאווה (28.10)", urgent: "עד שבוע לפני", desc: "Thunderbird עד Tsuruga, ומשם Hokuriku Shinkansen.", url: "https://www.westjr.co.jp/global/en/", urlLabel: "JR West", order: 10 },
  { id: "tb-azusa", cat: "train", list: "tobook", title: "Azusa מצומוטו ← שינג'וקו (3.11)", urgent: "עד שבוע לפני", url: "https://www.eki-net.com/en/", urlLabel: "eki-net.com", order: 11 },
  { id: "tb-chopsticks", cat: "activity", list: "tobook", title: "סדנת Chopsticks Studio Ginza (3.11)", urgent: "מהגיליון", desc: "דרך Klook.", code: ["קוד הנחה", "OMERZTRAVEL"], url: "https://www.klook.com/", urlLabel: "klook.com", order: 12 },
  { id: "tb-ginza-dinner", cat: "food", list: "tobook", title: "ארוחת ערב שווה בגינזה (4.11)", urgent: "מהגיליון", order: 13 },
  { id: "tb-bags", cat: "prep", list: "tobook", sug: 1, title: "לוודא שהמלון בגינזה שומר מזוודות שבוע", urgent: "אחרי שסוגרים", desc: "אם שולחים את המזוודות מקיוטו ישר לגינזה. האפשרויות בלשונית \"ציוד ומידע\", תחת מזוודות.", order: 14 },
  { id: "tb-insurance", cat: "prep", list: "tobook", sug: 1, title: "ביטוח נסיעות", urgent: "לפני הטיסה", order: 15 },
  { id: "tb-esim", cat: "prep", list: "tobook", sug: 1, title: "eSIM או חבילת גלישה ליפן", urgent: "לפני הטיסה", order: 16 },
  { id: "tb-suica", cat: "prep", list: "tobook", sug: 1, title: "Suica או PASMO בטלפון", urgent: "לפני הטיסה", desc: "לרכבות ולאוטובוסים בתוך הערים, וגם לתשלום בחנויות נוחות. באייפון מוסיפים אותו ב-Wallet.", order: 17 }
);
// the old page's checklist (t1..t8) saved ticks per device; they carry over once, on first open
DATA.oldTodo = { t1: ["tb-nohi"], t2: ["tb-alpico"], t3: ["tb-teamlab"], t4: ["tb-shibuyasky"], t5: ["tb-hotel-kyoto", "tb-hotel-takayama", "tb-hotel-onsen", "tb-hotel-ginza"], t6: ["tb-shinkansen", "tb-kanazawa", "tb-azusa"], t7: ["tb-chopsticks"], t8: ["tb-ginza-dinner"] };
