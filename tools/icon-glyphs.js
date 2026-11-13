/*
 * 카품 아이콘 원본 도안(24×24 선 도안). tools/render-icons.js가 이 도안을 3D로 빚어 assets/icons/*.webp로 렌더링한다.
 * 외부 아이콘 세트를 쓰지 않고 팀이 직접 만든 도안이다.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CarpoomGlyphs = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const ICONS = {
    home: '<path d="M3.5 10.5 12 4l8.5 6.5"/><path d="M5.5 9v10.5h13V9"/><path d="M10 19.5v-5h4v5"/>',
    pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
    seat: '<path d="M8 3.5h2.5a1 1 0 0 1 1 1.1l-.9 7.4h5.9a2 2 0 0 1 2 2V17H8.6a2 2 0 0 1-2-1.8L6 5.6a2 2 0 0 1 2-2.1z"/><path d="M9 17l-1 3.5M16 17l1 3.5"/>',
    chair:
      '<path d="M7.5 3.5h2.5a1 1 0 0 1 1 1V12h5.5A1.5 1.5 0 0 1 18 13.5V16H8a1.5 1.5 0 0 1-1.5-1.5v-10a1 1 0 0 1 1-1z"/><path d="M8.5 16v4.5M16.5 16v4.5"/>',
    recline:
      '<path d="M4 6.8l2.8-1.3a1 1 0 0 1 1.3.5l3.2 7h6.7a2 2 0 0 1 2 2V17H10a2 2 0 0 1-1.8-1.2z"/><path d="M10.5 17l-1.2 3.5M17.5 17l1 3.5"/>',
    sparkles:
      '<path d="M12 3.5l1.6 4.4 4.4 1.6-4.4 1.6L12 15.5l-1.6-4.4L6 9.5l4.4-1.6z"/><path d="M18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
    bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    car: '<path d="M3.5 15.5v-3l2-4.2A2 2 0 0 1 7.3 7h9.4a2 2 0 0 1 1.8 1.3l2 4.2v3a1 1 0 0 1-1 1h-1.2M6.7 16.5H4.5a1 1 0 0 1-1-1M10.3 16.5h3.4"/><path d="M3.5 12.5h17"/><circle cx="8.5" cy="16.5" r="1.8"/><circle cx="15.5" cy="16.5" r="1.8"/>',
    'car-front':
      '<path d="M5 11l1.6-4.3A2 2 0 0 1 8.5 5.4h7a2 2 0 0 1 1.9 1.3L19 11"/><rect x="3.5" y="11" width="17" height="6" rx="2"/><path d="M6 17v2.5M18 17v2.5"/><circle cx="7.5" cy="14" r="1"/><circle cx="16.5" cy="14" r="1"/>',
    window: '<path d="M4 18.5v-9L10 5h9.5a.5.5 0 0 1 .5.5v13z"/><path d="M4 13.5h16"/>',
    wind: '<path d="M3.5 9h11a2.5 2.5 0 1 0-2.5-2.5"/><path d="M3.5 13h15a2.5 2.5 0 1 1-2.5 2.5"/><path d="M3.5 17h7"/>',
    fire: '<path d="M8 20c-2-2-1-4 0-5.5S9 11 7.5 9"/><path d="M12.5 20c-2-2-1-4 0-5.5s1-3.5-.5-5.5"/><path d="M17 20c-2-2-1-4 0-5.5s1-3.5-.5-5.5"/><path d="M5 5.5h14"/>',
    hand: '<path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12"/><path d="M11 11V5a1.5 1.5 0 0 1 3 0v6"/><path d="M14 11V6.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-.5A5.5 5.5 0 0 1 6 17.4L4.6 14a1.4 1.4 0 0 1 2.4-1.4L8 14"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>',
    wrench:
      '<path d="M15 4a4.5 4.5 0 0 0-4.3 5.8L4.5 16a1.8 1.8 0 0 0 2.5 2.5l6.2-6.2A4.5 4.5 0 0 0 19 8l-2.6 2.6-2.4-.6-.6-2.4L16 5z"/>',
    satellite:
      '<path d="M5.5 12a6.5 6.5 0 0 1 6.5-6.5M8.5 12A3.5 3.5 0 0 1 12 8.5"/><path d="M18.5 12A6.5 6.5 0 0 0 12 5.5"/><circle cx="12" cy="12" r="1.5"/><path d="M12 13.5V20M9 20h6"/>',
    phone: '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/>',
    call: '<path d="M6.5 4h3l1.5 4-2 1.3a10 10 0 0 0 5.7 5.7L16 13l4 1.5v3a2 2 0 0 1-2.2 2A15 15 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4z"/>',
    map: '<path d="M9 5 3.5 7v12L9 17l6 2 5.5-2V5L15 7z"/><path d="M9 5v12M15 7v12"/>',
    mail: '<rect x="3.5" y="6" width="17" height="12" rx="2"/><path d="m4 7 8 6 8-6"/>',
    key: '<circle cx="8" cy="15" r="3.5"/><path d="M10.5 12.5 19 4M15.5 7.5 18 10M13.5 9.5l2 2"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/><path d="M12 14.5v2"/>',
    hourglass:
      '<path d="M7 3.5h10M7 20.5h10"/><path d="M8 3.5c0 4 8 5 8 8.5s-8 4.5-8 8.5M16 3.5c0 4-8 5-8 8.5s8 4.5 8 8.5"/>',
    construction: '<path d="M9.5 4h5l4 15h-13z"/><path d="M8 11h8M7 15h10M4 20h16"/>',
    computer: '<rect x="3.5" y="5" width="17" height="11" rx="2"/><path d="M9 20h6M12 16v4"/>',
    camera:
      '<path d="M4.5 8h3L9 5.5h6L16.5 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>',
    check: '<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.2 2.4 2.4 4.6-4.8"/>',
    cross: '<circle cx="12" cy="12" r="8.5"/><path d="m9 9 6 6M15 9l-6 6"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
    warning: '<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17h.01"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    party: '<path d="M4 20 8.5 8l7.5 7.5z"/><path d="M14 4v2M19 6l-1.5 1.5M20 11h-2M11.5 6.5l1-1.5"/>',
    'stop-x': '<path d="M8.5 3.5h7l5 5v7l-5 5h-7l-5-5v-7z"/><path d="m9.5 9.5 5 5M14.5 9.5l-5 5"/>',
    adult: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    child:
      '<circle cx="12" cy="9.5" r="3.2"/><path d="M6.5 20a5.5 5.5 0 0 1 11 0"/><path d="M10.6 5.6c.4-1.1 1.1-1.9 2-2.1"/>',
    arrows: '<path d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4"/>',
    apartment:
      '<rect x="5" y="3.5" width="14" height="17" rx="1"/><path d="M9 7.5h2M13 7.5h2M9 11h2M13 11h2M9 14.5h2M13 14.5h2M10.5 20.5v-3h3v3"/>',
  };
  ICONS.music =
    '<path d="M9 17.5V6l10-2v11.5"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="15.5" r="2.5"/>';
  ICONS.clock = '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.2V12l3.4 2.2"/>';
  ICONS.plus = '<path d="M12 5v14M5 12h14"/>';
  ICONS.wave = ICONS.hand;
  ICONS['house-garden'] = ICONS.home;
  ICONS.success = ICONS.check;
  return ICONS;
});
