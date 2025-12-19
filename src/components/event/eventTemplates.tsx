// Event Templates Configuration
export interface EventIcon {
  url: string;
  position: {
    top: string;
    left: string;
  };
}

export interface EventTemplate {
  id: string;
  name: string;
  backgroundColor: string;
  gradientColors: string[];
  pattern: string | null;
  icons?: EventIcon[];
}

export const eventTemplates: EventTemplate[] = [
  {
    id: 'default',
    name: 'Standaard',
    backgroundColor: '#F5F0E6',
    gradientColors: ['#F5F0E6', '#E6EBE0'],
    pattern: null
  },
  {
    id: 'christmas',
    name: 'Kerst',
    backgroundColor: '#606C38',
    gradientColors: ['#606C38', '#283618'],
    pattern: "data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l15 30-15 30L15 30z' fill='%23ffffff' fill-opacity='0.2'/%3E%3C/svg%3E",
    icons: [
      {
        url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"%3E%3Cpath d="M12 2L9 9H3L8 13L6 20L12 16L18 20L16 13L21 9H15L12 2Z"/%3E%3C/svg%3E',
        position: { top: '10%', left: '5%' }
      },
      {
        url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"%3E%3Cpath d="M12 3L16 12H8L12 3Z"/%3E%3Crect x="10" y="12" width="4" height="9"/%3E%3C/svg%3E',
        position: { top: '15%', left: '85%' }
      },
      {
        url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"%3E%3Cpath d="M3 21H21M12 3L5 13H19L12 3Z"/%3E%3C/svg%3E',
        position: { top: '75%', left: '15%' }
      }
    ]
  },
  {
    id: 'birthday',
    name: 'Verjaardag',
    backgroundColor: '#FFE5D9',
    gradientColors: ['#FFE5D9', '#FFDDD2'],
    pattern: "data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='30' cy='30' r='10' fill='%23ffffff' fill-opacity='0.4'/%3E%3C/svg%3E",
    icons: [
      {
        url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23FF9B9B" stroke-width="2"%3E%3Cpath d="M3 10H21M12 3V21M5.2 5.2L18.8 18.8M18.8 5.2L5.2 18.8"/%3E%3C/svg%3E',
        position: { top: '20%', left: '10%' }
      }
    ]
  },
  // Add more templates here...
];
