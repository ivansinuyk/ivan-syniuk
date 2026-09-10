// Career start year for dynamic experience calculation
const CAREER_START_YEAR = 2019;
const yearsOfExperience = new Date().getFullYear() - CAREER_START_YEAR;

export const site = {
  name: 'Ivan Syniuk',
  title: 'Ivan Syniuk — React Native developer & blog',
  tagline: `React Native developer · ${yearsOfExperience} years experience`,
  email: 'i.sinuyk@gmail.com',
  location: 'Odesa, Ukraine',
  bio: `I'm Ivan Syniuk, from Odesa, Ukraine. I studied at Odesa National Polytechnic University and have been working as a React Native developer for the past ${yearsOfExperience} years.`,
  skills: [
    'React Native',
    'Expo SDK',
    'EAS Updates',
    'TypeScript',
    'Node.js',
    'Native Modules',
    'TurboModules',
    'Worklets',
    'Skia',
    '2D games',
  ],
  social: {
    github: 'https://github.com/ivansinuyk',
    linkedin: 'https://www.linkedin.com/in/ivan-syniuk-b31bab204/',
    twitter: 'https://x.com/IvanSinuk',
  },
} as const
