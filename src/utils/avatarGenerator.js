export const generateAvatar = (name) => {
  if (!name) name = 'User';
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  
  // Deterministic color based on name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = '#' + (hash & 0x00FFFFFF).toString(16).toUpperCase().padStart(6, '0');
  
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 150 150'>
    <rect width='150' height='150' fill='${color}'/>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='50' fill='#fff'>${initials}</text>
  </svg>`;
  
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
};