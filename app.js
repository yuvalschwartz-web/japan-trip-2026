(function () {
  // Checklist: remembered per device.
  var key = 'japan2026-todo';
  var state = {};
  try { state = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (e) { state = {}; }
  document.querySelectorAll('#todolist input[type=checkbox]').forEach(function (cb) {
    var li = cb.closest('li');
    if (state[cb.id]) { cb.checked = true; li.classList.add('done'); }
    cb.addEventListener('change', function () {
      li.classList.toggle('done', cb.checked);
      state[cb.id] = cb.checked;
      try { localStorage.setItem(key, JSON.stringify(state)); } catch (e) {}
    });
  });

  // Today: highlight the current trip day (Japan time) or count down to departure.
  var START = Date.UTC(2026, 9, 21); // 21/10/2026
  var DAYS = 16;
  var CITY = ['טוקיו', 'טוקיו', 'טוקיו', 'טוקיו', 'קיוטו', 'קיוטו', 'קיוטו', 'קנזאווה', 'קנזאווה',
    'שיראקאווה-גו וטקאיאמה', 'טקאיאמה ואונסן', 'קמיקוצ\'י ומצומוטו', 'עמק קיסו', 'גינזה', 'גינזה', 'חזרה הביתה'];

  function dateIn(tz) {
    try {
      var p = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
        .formatToParts(new Date());
      var g = function (t) { return +p.find(function (x) { return x.type === t; }).value; };
      return Date.UTC(g('year'), g('month') - 1, g('day'));
    } catch (e) {
      var d = new Date();
      return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    }
  }

  var status = document.getElementById('status');
  var btn = document.getElementById('todayBtn');
  var idx = Math.round((dateIn('Asia/Tokyo') - START) / 864e5); // 0-based trip day
  var localLeft = Math.round((START - dateIn(undefined)) / 864e5);

  if (idx >= 0 && idx < DAYS) {
    var id = 'd' + (idx + 1);
    var card = document.getElementById(id);
    var cell = document.querySelector('.strip a[href="#' + id + '"]');
    if (card) card.classList.add('today');
    if (cell) cell.classList.add('today');
    status.textContent = 'יום ' + (idx + 1) + ' מתוך ' + DAYS + ' · ' + CITY[idx];
    status.hidden = false;
    btn.hidden = false;
    btn.addEventListener('click', function () { card && card.scrollIntoView({ block: 'start' }); });
    if (!location.hash && card) setTimeout(function () { card.scrollIntoView({ block: 'start', behavior: 'instant' }); }, 50);
  } else if (localLeft > 0) {
    status.textContent = localLeft === 1 ? 'טסים מחר ✈' : 'עוד ' + localLeft + ' ימים לטיסה ✈';
    status.hidden = false;
  }

  // Offline support (works when served from the web app, not inside the Claude viewer).
  var off = document.getElementById('offline');
  if ('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.register('sw.js').then(function () {
      return navigator.serviceWorker.ready;
    }).then(function () {
      if (off) off.textContent = 'נשמר לשימוש גם בלי אינטרנט.';
    }).catch(function () {});
  }
})();
